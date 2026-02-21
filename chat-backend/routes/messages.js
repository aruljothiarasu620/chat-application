const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/messages — Send a message
// This also emits a socket event via the io instance attached to app
router.post('/', authMiddleware, async (req, res) => {
    const senderId = req.user.id;
    const { conversationId, content } = req.body;

    if (!conversationId || !content)
        return res.status(400).json({ error: 'conversationId and content are required' });

    try {
        // Verify sender is part of this conversation
        const [conv] = await db.query(
            'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
            [conversationId, senderId, senderId]
        );
        if (conv.length === 0) return res.status(403).json({ error: 'Access denied' });

        // Insert message
        const [result] = await db.query(
            'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
            [conversationId, senderId, content]
        );

        const [rows] = await db.query(
            `SELECT m.*, u.username AS sender_username
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
            [result.insertId]
        );
        const message = rows[0];

        // Emit to socket room
        const io = req.app.get('io');
        if (io) {
            io.to(`conv_${conversationId}`).emit('newMessage', message);
        }

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
