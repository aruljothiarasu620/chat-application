const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required' });

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [
            username,
            passwordHash,
        ]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.errno === 19 || err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Username already taken' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password are required' });

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0)
            return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
