const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/conversations — list conversations for logged-in user
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.query(
            `SELECT c.id, c.created_at,
        u.id AS other_user_id, u.username AS other_username,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) AS last_message,
        (SELECT sent_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) AS last_message_at
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY last_message_at DESC`,
            [userId, userId, userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/conversations — start a conversation with another user by username
router.post('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    try {
        // Find the target user
        const [users] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const targetId = users[0].id;
        if (targetId === userId) return res.status(400).json({ error: 'Cannot start a conversation with yourself' });

        // Ensure consistent ordering (lower id is always user1)
        const [u1, u2] = userId < targetId ? [userId, targetId] : [targetId, userId];

        // Check if conversation already exists
        const [existing] = await db.query(
            'SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?',
            [u1, u2]
        );
        if (existing.length > 0) return res.json(existing[0]);

        const [result] = await db.query(
            'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
            [u1, u2]
        );
        const [newConv] = await db.query('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
        res.status(201).json(newConv[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/conversations/:conversationId/messages
router.get('/:conversationId/messages', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { conversationId } = req.params;

    try {
        // Verify user is part of this conversation
        const [conv] = await db.query(
            'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [conversationId, userId, userId]
        );
        if (conv.length === 0) return res.status(403).json({ error: 'Access denied' });

        const [messages] = await db.query(
            `SELECT m.*, u.username AS sender_username
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.sent_at ASC`,
            [conversationId]
        );
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
