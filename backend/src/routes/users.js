const express = require('express');
const bcrypt = require('bcryptjs');
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

// POST /api/users — Create a new user (Director/Manager only)
router.post('/', authenticate, async (req, res) => {
    try {
        // Only Director (hierarchy_level 1) and Manager (hierarchy_level 2) can create users
        if (req.user.hierarchy_level > 2) {
            return res.status(403).json({ error: 'You do not have permission to create users.' });
        }

        const { first_name, last_name, email, password, role_id, phone } = req.body;

        if (!first_name || !last_name || !email || !password || !role_id) {
            return res.status(400).json({ error: 'first_name, last_name, email, password, and role_id are required.' });
        }

        const existing = await db('users').where({ email }).first();
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const [user] = await db('users')
            .insert({
                first_name,
                last_name,
                email,
                password_hash,
                role_id,
                phone: phone || null,
                organization_id: null,
            })
            .returning(['id', 'first_name', 'last_name', 'email', 'role_id']);

        // Fetch the role name for the response
        const role = await db('roles').where({ id: role_id }).first();

        res.status(201).json({
            ...user,
            role_name: role ? role.name : null,
            role_side: role ? role.side : null,
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user.' });
    }
});

module.exports = router;
