const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
    try {
        const [orgCount] = await db('organizations').where({ is_active: true }).count();
        const [assignmentCount] = await db('assignments').where({ is_active: true }).count();
        const [projectCount] = await db('projects').where({ is_active: true }).count();
        const [userCount] = await db('users').where({ is_active: true }).count();

        // Project status breakdown
        const projectStatuses = await db('projects')
            .where({ is_active: true })
            .groupBy('status')
            .select('status', db.raw('COUNT(*) as count'));

        // Task stats
        const [taskStats] = await db('project_tasks')
            .select(
                db.raw('COUNT(*) as total'),
                db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed"),
                db.raw("COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress"),
                db.raw("COUNT(*) FILTER (WHERE status = 'overdue' OR (due_date < NOW() AND status NOT IN ('completed', 'skipped'))) as overdue"),
                db.raw("COUNT(*) FILTER (WHERE status = 'not_started') as not_started")
            );

        // Recent projects
        const recentProjects = await db('projects')
            .join('assignments', 'projects.assignment_id', 'assignments.id')
            .join('organizations', 'assignments.organization_id', 'organizations.id')
            .join('services', 'projects.service_id', 'services.id')
            .select(
                'projects.id', 'projects.name', 'projects.status', 'projects.progress_percentage',
                'projects.start_date', 'projects.end_date',
                'organizations.name as organization_name',
                'assignments.name as assignment_name',
                'services.name as service_name'
            )
            .where('projects.is_active', true)
            .orderBy('projects.created_at', 'desc')
            .limit(5);

        res.json({
            counts: {
                organizations: parseInt(orgCount.count),
                assignments: parseInt(assignmentCount.count),
                projects: parseInt(projectCount.count),
                users: parseInt(userCount.count),
            },
            projectStatuses,
            taskStats: {
                total: parseInt(taskStats.total),
                completed: parseInt(taskStats.completed),
                in_progress: parseInt(taskStats.in_progress),
                overdue: parseInt(taskStats.overdue),
                not_started: parseInt(taskStats.not_started),
            },
            recentProjects,
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
    }
});

module.exports = router;
