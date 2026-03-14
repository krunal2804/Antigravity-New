const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/assignments
router.get('/', authenticate, async (req, res) => {
    try {
        const { organization_id } = req.query;
        let query = db('assignments')
            .join('organizations', 'assignments.organization_id', 'organizations.id')
            .select('assignments.*', 'organizations.name as organization_name')
            .where('assignments.is_active', true);

        if (organization_id) query = query.where('assignments.organization_id', organization_id);

        const assignments = await query.orderBy('assignments.name');

        const enriched = await Promise.all(
            assignments.map(async (a) => {
                const [{ count }] = await db('projects').where({ assignment_id: a.id, is_active: true }).count();
                return { ...a, project_count: parseInt(count) };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error('Get assignments error:', err);
        res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
});

// GET /api/assignments/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const assignment = await db('assignments')
            .join('organizations', 'assignments.organization_id', 'organizations.id')
            .select('assignments.*', 'organizations.name as organization_name')
            .where('assignments.id', req.params.id)
            .first();
        if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

        const projects = await db('projects')
            .join('services', 'projects.service_id', 'services.id')
            .select('projects.*', 'services.name as service_name')
            .where({ assignment_id: assignment.id, 'projects.is_active': true });

        // Enrich with task stats for progress
        const enrichedProjects = await Promise.all(
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

        res.json({ ...assignment, projects: enrichedProjects });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch assignment.' });
    }
});

// POST /api/assignments
router.post('/', authenticate, authorize('assignments', 'can_create'), async (req, res) => {
    try {
        const { organization_id, name, location, description, start_date, end_date, projects } = req.body;
        if (!organization_id || !name) return res.status(400).json({ error: 'organization_id and name are required.' });

        const assignment = await db.transaction(async (trx) => {
            const [newAssignment] = await trx('assignments')
                .insert({ organization_id, name, location, description, start_date, end_date })
                .returning('*');

            if (projects && Array.isArray(projects) && projects.length > 0) {
                for (const proj of projects) {
                    if (!proj.name || !proj.service_id) continue; // Skip invalid projects
                    
                    const [newProject] = await trx('projects')
                        .insert({
                            assignment_id: newAssignment.id,
                            service_id: proj.service_id,
                            name: proj.name,
                            description: proj.description || null,
                            project_code: proj.project_code || null,
                            start_date: proj.start_date || null,
                            end_date: proj.end_date || null,
                            created_by: req.user.id
                        })
                        .returning('*');

                    // Auto-populate tasks from service_steps template
                    const serviceSteps = await trx('service_steps')
                        .where({ service_id: proj.service_id, is_active: true })
                        .orderBy('sequence_order');

                    if (serviceSteps.length > 0) {
                        const stepIds = serviceSteps.map(s => s.id);
                        const serviceTasks = await trx('service_tasks')
                            .whereIn('service_step_id', stepIds)
                            .where({ is_active: true })
                            .orderBy('sequence_order');

                        if (serviceTasks.length > 0) {
                            const projectTasks = serviceTasks.map((st) => {
                                const stepName = serviceSteps.find(s => s.id === st.service_step_id)?.name || null;

                                let taskStart = null;
                                let taskDue = null;
                                if (proj.start_date && st.default_duration_days) {
                                    taskStart = proj.start_date;
                                    const due = new Date(proj.start_date);
                                    due.setDate(due.getDate() + st.default_duration_days);
                                    taskDue = due.toISOString().split('T')[0];
                                }
                                return {
                                    project_id: newProject.id,
                                    service_task_id: st.id,
                                    step_name: stepName,
                                    name: st.name,
                                    description: st.description,
                                    sequence_order: st.sequence_order,
                                    is_mandatory: st.is_mandatory,
                                    start_date: taskStart,
                                    due_date: taskDue,
                                };
                            });
                            await trx('project_tasks').insert(projectTasks);
                        }
                    }

                    // Add creator as primary project member
                    await trx('project_members').insert({
                        project_id: newProject.id,
                        user_id: req.user.id,
                        role_id: req.user.role_id,
                        is_primary: true,
                    });

                    // Create timeline event
                    await trx('project_timeline_events').insert({
                        project_id: newProject.id,
                        event_type: 'milestone',
                        title: 'Project Created',
                        description: `Project "${proj.name}" was created during assignment creation.`,
                        created_by: req.user.id,
                    });
                }
            }
            return newAssignment;
        });

        res.status(201).json(assignment);
    } catch (err) {
        console.error('Create assignment error:', err);
        res.status(500).json({ error: 'Failed to create assignment and projects.' });
    }
});

// PUT /api/assignments/:id
router.put('/:id', authenticate, authorize('assignments', 'can_edit'), async (req, res) => {
    try {
        const { name, location, description, start_date, end_date, status } = req.body;
        const [assignment] = await db('assignments')
            .where({ id: req.params.id })
            .update({ name, location, description, start_date, end_date, status, updated_at: db.fn.now() })
            .returning('*');
        if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update assignment.' });
    }
});

// DELETE /api/assignments/:id (soft delete with cascade)
router.delete('/:id', authenticate, authorize('assignments', 'can_delete'), async (req, res) => {
    try {
        await db.transaction(async (trx) => {
            // Deactivate assignment
            await trx('assignments').where({ id: req.params.id }).update({ is_active: false });

            // Deactivate projects
            await trx('projects').where({ assignment_id: req.params.id }).update({ is_active: false });
        });
        res.json({ message: 'Assignment and related projects deactivated.' });
    } catch (err) {
        console.error('Cascading delete assignment error:', err);
        res.status(500).json({ error: 'Failed to delete assignment.' });
    }
});

module.exports = router;
