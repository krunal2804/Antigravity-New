const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks?project_id=X
router.get('/', authenticate, async (req, res) => {
    try {
        const { project_id } = req.query;
        if (!project_id) return res.status(400).json({ error: 'project_id is required.' });

        const tasks = await db('project_tasks')
            .leftJoin('users', 'project_tasks.assigned_to', 'users.id')
            .select(
                'project_tasks.*',
                'users.first_name as assignee_first_name',
                'users.last_name as assignee_last_name'
            )
            .where({ project_id })
            .orderBy('sequence_order');

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, authorize('tasks', 'can_edit'), async (req, res) => {
    try {
        const { status, assigned_to, start_date, due_date, actual_start_date, actual_end_date, remarks } = req.body;

        const updateData = { updated_at: db.fn.now() };
        if (status !== undefined) updateData.status = status;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (due_date !== undefined) updateData.due_date = due_date;
        if (actual_start_date !== undefined) updateData.actual_start_date = actual_start_date;
        if (actual_end_date !== undefined) updateData.actual_end_date = actual_end_date;
        if (remarks !== undefined) updateData.remarks = remarks;

        // If completing a task, set actual_end_date
        if (status === 'completed' && !actual_end_date) {
            updateData.actual_end_date = new Date().toISOString().split('T')[0];
        }
        // If starting, set actual_start_date
        if (status === 'in_progress' && !actual_start_date) {
            updateData.actual_start_date = new Date().toISOString().split('T')[0];
        }

        const [task] = await db('project_tasks').where({ id: req.params.id }).update(updateData).returning('*');
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        // Recalculate project progress
        const stats = await db('project_tasks')
            .where({ project_id: task.project_id })
            .select(
                db.raw('COUNT(*) as total'),
                db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed")
            )
            .first();

        const progress = stats.total > 0 ? ((parseInt(stats.completed) / parseInt(stats.total)) * 100).toFixed(2) : 0;
        await db('projects').where({ id: task.project_id }).update({ progress_percentage: progress });

        res.json(task);
    } catch (err) {
        console.error('Update task error:', err);
        res.status(500).json({ error: 'Failed to update task.' });
    }
});

// GET /api/tasks/my — Get all tasks assigned to the current user
router.get('/my', authenticate, async (req, res) => {
    try {
        const tasks = await db('project_tasks')
            .join('projects', 'project_tasks.project_id', 'projects.id')
            .join('assignments', 'projects.assignment_id', 'assignments.id')
            .join('organizations', 'assignments.organization_id', 'organizations.id')
            .select(
                'project_tasks.*',
                'projects.name as project_name',
                'assignments.name as assignment_name',
                'organizations.name as organization_name'
            )
            .where('project_tasks.assigned_to', req.user.id)
            .orderBy('project_tasks.sequence_order');

        res.json(tasks);
    } catch (err) {
        console.error('Fetch my tasks error:', err);
        res.status(500).json({ error: 'Failed to fetch your tasks.' });
    }
});

module.exports = router;
