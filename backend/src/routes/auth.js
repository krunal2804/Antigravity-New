const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, role_id, organization_id, phone } = req.body;

        if (!first_name || !last_name || !email || !password || !role_id) {
            return res.status(400).json({ error: 'first_name, last_name, email, password, and role_id are required.' });
        }

        const existing = await db('users').where({ email }).first();
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const [user] = await db('users')
            .insert({ first_name, last_name, email, password_hash, role_id, organization_id: organization_id || null, phone: phone || null })
            .returning(['id', 'first_name', 'last_name', 'email', 'role_id', 'organization_id']);

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'default_secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .select(
                'users.id', 'users.first_name', 'users.last_name', 'users.email',
                'users.password_hash', 'users.role_id', 'users.organization_id',
                'users.is_active', 'users.avatar_url',
                'roles.name as role_name', 'roles.side as role_side', 'roles.hierarchy_level'
            )
            .where('users.email', email)
            .first();

        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'default_secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });

        delete user.password_hash;
        res.json({ user, token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const permissions = await db('permissions').where({ role_id: req.user.role_id });
        res.json({ user: req.user, permissions });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user info.' });
    }
});

module.exports = router;
