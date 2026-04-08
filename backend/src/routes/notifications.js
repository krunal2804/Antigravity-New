const express = require('express');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await db('notifications')
            .where({ user_id: req.user.id })
            .orderBy('created_at', 'desc')
            .limit(50); // increased limit from my-portal's 5
        res.json(notifications);
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const [result] = await db('notifications')
            .where({ user_id: req.user.id, is_read: false })
            .count('id as count');
        res.json({ count: parseInt(result.count) });
    } catch (err) {
        console.error('Unread count error:', err);
        res.status(500).json({ error: 'Failed to fetch unread count.' });
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const result = await db('notifications')
            .where({ id: req.params.id, user_id: req.user.id })
            .update({ is_read: true });
        
        if (!result) return res.status(404).json({ error: 'Notification not found.' });
        res.json({ message: 'Notification marked as read.' });
    } catch (err) {
        console.error('Mark as read error:', err);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res) => {
    try {
        await db('notifications')
            .where({ user_id: req.user.id, is_read: false })
            .update({ is_read: true });
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('Read all error:', err);
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
});

module.exports = router;
