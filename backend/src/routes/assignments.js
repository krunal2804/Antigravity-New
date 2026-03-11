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

        res.json({ ...assignment, projects });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch assignment.' });
    }
});

// POST /api/assignments
router.post('/', authenticate, authorize('assignments', 'can_create'), async (req, res) => {
    try {
        const { organization_id, name, location, description, start_date, end_date } = req.body;
        if (!organization_id || !name) return res.status(400).json({ error: 'organization_id and name are required.' });

        const [assignment] = await db('assignments')
            .insert({ organization_id, name, location, description, start_date, end_date })
            .returning('*');

        res.status(201).json(assignment);
    } catch (err) {
        console.error('Create assignment error:', err);
        res.status(500).json({ error: 'Failed to create assignment.' });
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

// DELETE /api/assignments/:id (soft delete)
router.delete('/:id', authenticate, authorize('assignments', 'can_delete'), async (req, res) => {
    try {
        await db('assignments').where({ id: req.params.id }).update({ is_active: false });
        res.json({ message: 'Assignment deactivated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete assignment.' });
    }
});

module.exports = router;
