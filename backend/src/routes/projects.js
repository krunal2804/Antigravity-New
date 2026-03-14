const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
    try {
        const { assignment_id, status } = req.query;
        let query = db('projects')
            .join('assignments', 'projects.assignment_id', 'assignments.id')
            .join('organizations', 'assignments.organization_id', 'organizations.id')
            .join('services', 'projects.service_id', 'services.id')
            .select(
                'projects.*',
                'assignments.name as assignment_name',
                'organizations.name as organization_name',
                'organizations.id as organization_id',
                'services.name as service_name'
            )
            .where('projects.is_active', true);

        if (assignment_id) query = query.where('projects.assignment_id', assignment_id);
        if (status) query = query.where('projects.status', status);

        const projects = await query.orderBy('projects.created_at', 'desc');

        // Enrich with task stats
        const enriched = await Promise.all(
            projects.map(async (p) => {
                const taskStats = await db('project_tasks')
                    .where({ project_id: p.id })
                    .select(
                        db.raw('COUNT(*) as total'),
                        db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed"),
                        db.raw("COUNT(*) FILTER (WHERE status = 'overdue' OR (due_date < NOW() AND status NOT IN ('completed', 'skipped'))) as overdue")
                    )
                    .first();
                return {
                    ...p,
                    task_total: parseInt(taskStats.total),
                    task_completed: parseInt(taskStats.completed),
                    task_overdue: parseInt(taskStats.overdue),
                };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error('Get projects error:', err);
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const project = await db('projects')
            .join('assignments', 'projects.assignment_id', 'assignments.id')
            .join('organizations', 'assignments.organization_id', 'organizations.id')
            .join('services', 'projects.service_id', 'services.id')
            .select(
                'projects.*',
                'assignments.name as assignment_name',
                'organizations.name as organization_name',
                'organizations.id as organization_id',
                'services.name as service_name'
            )
            .where('projects.id', req.params.id)
            .first();

        if (!project) return res.status(404).json({ error: 'Project not found.' });

        const tasks = await db('project_tasks')
            .leftJoin('users', 'project_tasks.assigned_to', 'users.id')
            .select('project_tasks.*', 'users.first_name as assignee_first_name', 'users.last_name as assignee_last_name')
            .where({ project_id: project.id })
            .orderBy('sequence_order');

        const members = await db('project_members')
            .join('users', 'project_members.user_id', 'users.id')
            .join('roles', 'project_members.role_id', 'roles.id')
            .select('project_members.*', 'users.first_name', 'users.last_name', 'users.email', 'roles.name as role_name', 'roles.side')
            .where({ project_id: project.id })
            .whereNull('project_members.left_at');

        const timeline = await db('project_timeline_events')
            .leftJoin('users', 'project_timeline_events.created_by', 'users.id')
            .select('project_timeline_events.*', 'users.first_name as created_by_name')
            .where({ project_id: project.id })
            .orderBy('event_date', 'desc');

        res.json({ ...project, tasks, members, timeline });
    } catch (err) {
        console.error('Get project detail error:', err);
        res.status(500).json({ error: 'Failed to fetch project.' });
    }
});

// POST /api/projects
router.post('/', authenticate, authorize('projects', 'can_create'), async (req, res) => {
    try {
        const { assignment_id, service_id, name, description, project_code, start_date, end_date } = req.body;
        if (!assignment_id || !service_id || !name) {
            return res.status(400).json({ error: 'assignment_id, service_id, and name are required.' });
        }

        const [project] = await db('projects')
            .insert({ assignment_id, service_id, name, description, project_code, start_date, end_date, created_by: req.user.id })
            .returning('*');

        // Auto-populate tasks from service_tasks template
        const serviceTasks = await db('service_tasks').where({ service_id, is_active: true }).orderBy('sequence_order');

        if (serviceTasks.length > 0) {
            const projectTasks = serviceTasks.map((st) => {
                let taskStart = null;
                let taskDue = null;
                if (start_date && st.default_duration_days) {
                    taskStart = start_date;
                    const due = new Date(start_date);
                    due.setDate(due.getDate() + st.default_duration_days);
                    taskDue = due.toISOString().split('T')[0];
                }
                return {
                    project_id: project.id,
                    service_task_id: st.id,
                    name: st.name,
                    description: st.description,
                    sequence_order: st.sequence_order,
                    is_mandatory: st.is_mandatory,
                    start_date: taskStart,
                    due_date: taskDue,
                };
            });

            await db('project_tasks').insert(projectTasks);
        }

        // Add creator as project member
        await db('project_members').insert({
            project_id: project.id,
            user_id: req.user.id,
            role_id: req.user.role_id,
            is_primary: true,
        });

        // Create timeline event
        await db('project_timeline_events').insert({
            project_id: project.id,
            event_type: 'milestone',
            title: 'Project Created',
            description: `Project "${name}" was created.`,
            created_by: req.user.id,
        });

        res.status(201).json(project);
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, authorize('projects', 'can_edit'), async (req, res) => {
    try {
        const { name, description, start_date, end_date, status } = req.body;
        const [project] = await db('projects')
            .where({ id: req.params.id })
            .update({ name, description, start_date, end_date, status, updated_at: db.fn.now() })
            .returning('*');
        if (!project) return res.status(404).json({ error: 'Project not found.' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

// DELETE /api/projects/:id (soft)
router.delete('/:id', authenticate, authorize('projects', 'can_delete'), async (req, res) => {
    try {
        await db('projects').where({ id: req.params.id }).update({ is_active: false });
        res.json({ message: 'Project deactivated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

module.exports = router;
