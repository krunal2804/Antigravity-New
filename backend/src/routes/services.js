const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/services
router.get('/', authenticate, async (req, res) => {
    try {
        const services = await db('services').where({ is_active: true }).orderBy('name');
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch services.' });
    }
});

// GET /api/services/:id (with tasks)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const service = await db('services').where({ id: req.params.id }).first();
        if (!service) return res.status(404).json({ error: 'Service not found.' });
        const tasks = await db('service_tasks').where({ service_id: service.id, is_active: true }).orderBy('sequence_order');
        res.json({ ...service, tasks });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch service.' });
    }
});

module.exports = router;
