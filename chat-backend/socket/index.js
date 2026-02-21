const jwt = require('jsonwebtoken');

module.exports = function setupSocket(io) {
    // Middleware: authenticate socket connection via JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: No token'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // { id, username }
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

        // Join a conversation room
        socket.on('joinConversation', (conversationId) => {
            const room = `conv_${conversationId}`;
            socket.join(room);
            console.log(`${socket.user.username} joined room ${room}`);
        });

        // Leave a conversation room
        socket.on('leaveConversation', (conversationId) => {
            const room = `conv_${conversationId}`;
            socket.leave(room);
        });

        // Typing indicator
        socket.on('typing', ({ conversationId }) => {
            socket.to(`conv_${conversationId}`).emit('userTyping', {
                userId: socket.user.id,
                username: socket.user.username,
            });
        });

        socket.on('stopTyping', ({ conversationId }) => {
            socket.to(`conv_${conversationId}`).emit('userStoppedTyping', {
                userId: socket.user.id,
            });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.user.username}`);
        });
    });
};
