const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const { buildTaskLockState, resequenceProjectTasks } = require('../utils/projectTaskOrder');
const { deriveProjectWorkflowStatusFromTasks, deriveProjectWorkflowStatus } = require('../utils/workflowStatus');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
    try {
        const { assignment_id, status, service_id } = req.query;
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
        if (status) query = query.where('projects.status', status === 'active' ? 'in_progress' : status);
        if (service_id) query = query.where('projects.service_id', service_id);

        const projects = await query.orderBy('projects.created_at', 'desc');

        const enriched = await Promise.all(
            projects.map(async (p) => {
                const taskStats = await db('project_tasks')
                    .where({ project_id: p.id })
                    .select(
                        db.raw('COUNT(*) as total'),
                        db.raw("COUNT(*) FILTER (WHERE status IN ('completed', 'skipped')) as completed"),
                        db.raw("COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'skipped')) as overdue")
                    )
                    .first();

                const totalTasks = parseInt(taskStats.total, 10) || 0;
                const completedTasks = parseInt(taskStats.completed, 10) || 0;

                return {
                    ...p,
                    status: deriveProjectWorkflowStatus(totalTasks, completedTasks),
                    task_total: totalTasks,
                    task_completed: completedTasks,
                    task_overdue: parseInt(taskStats.overdue, 10) || 0,
                };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error('Get projects error:', err);
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

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
            .leftJoin('service_tasks', 'project_tasks.service_task_id', 'service_tasks.id')
            .leftJoin('service_steps', 'service_tasks.service_step_id', 'service_steps.id')
            .select(
                'project_tasks.*',
                'users.first_name as assignee_first_name',
                'users.last_name as assignee_last_name',
                'service_tasks.sequence_order as service_task_sequence_order',
                'service_steps.sequence_order as service_step_sequence_order'
            )
            .where({ project_id: project.id })
            .orderBy('service_steps.sequence_order')
            .orderBy('service_tasks.sequence_order')
            .orderBy('project_tasks.sequence_order')
            .orderBy('project_tasks.id');

        for (let task of tasks) {
            if (task.service_task_id) {
                task.documents = await db('reference_documents')
                    .join('service_task_documents', 'reference_documents.id', 'service_task_documents.document_id')
                    .where('service_task_documents.service_task_id', task.service_task_id)
                    .select('reference_documents.*');
            } else {
                task.documents = [];
            }
        }

        const members = await db('assignment_team_members')
            .join('users', 'assignment_team_members.user_id', 'users.id')
            .join('roles', 'users.role_id', 'roles.id')
            .select('assignment_team_members.user_id', 'assignment_team_members.title', 'users.first_name', 'users.last_name', 'users.email', 'roles.name as role_name', 'roles.side')
            .where('assignment_team_members.assignment_id', project.assignment_id);

        const timeline = await db('project_timeline_events')
            .leftJoin('users', 'project_timeline_events.created_by', 'users.id')
            .select('project_timeline_events.*', 'users.first_name as created_by_name')
            .where({ project_id: project.id })
            .orderBy('event_date', 'desc');

        const lockedTasks = buildTaskLockState(tasks);

        res.json({
            ...project,
            status: deriveProjectWorkflowStatusFromTasks(lockedTasks),
            tasks: lockedTasks,
            members,
            timeline,
        });
    } catch (err) {
        console.error('Get project detail error:', err);
        res.status(500).json({ error: 'Failed to fetch project.' });
    }
});

router.post('/', authenticate, authorize('projects', 'can_create'), async (req, res) => {
    try {
        const { assignment_id, service_id, name, description, project_code, start_date } = req.body;
        if (!assignment_id || !service_id || !name) {
            return res.status(400).json({ error: 'assignment_id, service_id, and name are required.' });
        }

        const [project] = await db('projects')
            .insert({ assignment_id, service_id, name, description, project_code, start_date, created_by: req.user.id })
            .returning('*');

        const serviceSteps = await db('service_steps')
            .where({ service_id, is_active: true })
            .orderBy('sequence_order');

        if (serviceSteps.length > 0) {
            const stepIds = serviceSteps.map(s => s.id);
            const serviceTasks = await db('service_tasks')
                .join('service_steps', 'service_tasks.service_step_id', 'service_steps.id')
                .whereIn('service_tasks.service_step_id', stepIds)
                .where({ 'service_tasks.is_active': true })
                .select('service_tasks.*', 'service_steps.sequence_order as step_sequence_order')
                .orderBy('service_steps.sequence_order')
                .orderBy('service_tasks.sequence_order')
                .orderBy('service_tasks.id');

            if (serviceTasks.length > 0) {
                const projectTasks = serviceTasks.map((st, index) => {
                    const stepName = serviceSteps.find(s => s.id === st.service_step_id)?.name || null;

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
                        step_name: stepName,
                        name: st.name,
                        description: st.description,
                        sequence_order: index + 1,
                        is_mandatory: st.is_mandatory,
                        start_date: taskStart,
                        due_date: taskDue,
                    };
                });

                await db('project_tasks').insert(projectTasks);
                await resequenceProjectTasks(db, project.id);
            }
        }

        await db('project_members').insert({
            project_id: project.id,
            user_id: req.user.id,
            role_id: req.user.role_id,
            is_primary: true,
        });

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

router.put('/:id', authenticate, authorize('projects', 'can_edit'), async (req, res) => {
    try {
        const { name, description, start_date } = req.body;
        const [project] = await db('projects')
            .where({ id: req.params.id })
            .update({ name, description, start_date, updated_at: db.fn.now() })
            .returning('*');
        if (!project) return res.status(404).json({ error: 'Project not found.' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

router.delete('/:id', authenticate, authorize('projects', 'can_delete'), async (req, res) => {
    try {
        await db('projects').where({ id: req.params.id }).update({ is_active: false });
        res.json({ message: 'Project deactivated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

module.exports = router;
