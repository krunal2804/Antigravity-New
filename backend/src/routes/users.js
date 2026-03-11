const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users
router.get('/', authenticate, async (req, res) => {
    try {
        const { role_side } = req.query;
        let query = db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .leftJoin('organizations', 'users.organization_id', 'organizations.id')
            .select(
                'users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.phone',
                'users.is_active', 'users.avatar_url', 'users.organization_id',
                'roles.name as role_name', 'roles.side as role_side',
                'organizations.name as organization_name'
            )
            .where('users.is_active', true);

        if (role_side) query = query.where('roles.side', role_side);

        const users = await query.orderBy('users.first_name');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// GET /api/users/roles
router.get('/roles', authenticate, async (req, res) => {
    try {
        const roles = await db('roles').where({ is_active: true }).orderBy('side').orderBy('hierarchy_level');
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roles.' });
    }
});

module.exports = router;
