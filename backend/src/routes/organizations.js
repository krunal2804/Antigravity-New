const express = require('express');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/organizations
router.get('/', authenticate, async (req, res) => {
    try {
        const orgs = await db('organizations')
            .select('organizations.*')
            .where('organizations.is_active', true)
            .orderBy('organizations.name');

        // Enrich with assignment and project counts
        const enriched = await Promise.all(
            orgs.map(async (org) => {
                const [{ count: assignmentCount }] = await db('assignments').where({ organization_id: org.id, is_active: true }).count();
                const [{ count: projectCount }] = await db('projects')
                    .join('assignments', 'projects.assignment_id', 'assignments.id')
                    .where({ 'assignments.organization_id': org.id, 'projects.is_active': true })
                    .count();
                return { ...org, assignment_count: parseInt(assignmentCount), project_count: parseInt(projectCount) };
            })
        );

        res.json(enriched);
    } catch (err) {
        console.error('Get orgs error:', err);
        res.status(500).json({ error: 'Failed to fetch organizations.' });
    }
});

// GET /api/organizations/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const org = await db('organizations').where({ id: req.params.id }).first();
        if (!org) return res.status(404).json({ error: 'Organization not found.' });

        const assignments = await db('assignments').where({ organization_id: org.id, is_active: true });
        res.json({ ...org, assignments });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch organization.' });
    }
});

// POST /api/organizations
router.post('/', authenticate, authorize('organizations', 'can_create'), async (req, res) => {
    try {
        const { name, industry, website, address, city, state, country, pincode, phone, email } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required.' });

        const [org] = await db('organizations')
            .insert({ name, industry, website, address, city, state, country, pincode, phone, email })
            .returning('*');

        res.status(201).json(org);
    } catch (err) {
        console.error('Create org error:', err);
        res.status(500).json({ error: 'Failed to create organization.' });
    }
});

// PUT /api/organizations/:id
router.put('/:id', authenticate, authorize('organizations', 'can_edit'), async (req, res) => {
    try {
        const { name, industry, website, address, city, state, country, pincode, phone, email } = req.body;
        const [org] = await db('organizations').where({ id: req.params.id }).update({ name, industry, website, address, city, state, country, pincode, phone, email, updated_at: db.fn.now() }).returning('*');
        if (!org) return res.status(404).json({ error: 'Organization not found.' });
        res.json(org);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update organization.' });
    }
});

// DELETE /api/organizations/:id (soft delete)
router.delete('/:id', authenticate, authorize('organizations', 'can_delete'), async (req, res) => {
    try {
        await db('organizations').where({ id: req.params.id }).update({ is_active: false });
        res.json({ message: 'Organization deactivated.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete organization.' });
    }
});

module.exports = router;
