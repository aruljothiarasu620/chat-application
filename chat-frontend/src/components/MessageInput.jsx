import { useState, useRef } from 'react';
import { getSocket } from '../sockets/socket';
import api from '../api/axios';

export default function MessageInput({ conversationId }) {
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const typingTimeoutRef = useRef(null);

    const emitTyping = () => {
        const socket = getSocket();
        if (!socket) return;
        socket.emit('typing', { conversationId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { conversationId });
        }, 1500);
    };

    const handleChange = (e) => {
        setContent(e.target.value);
        emitTyping();
    };

    const sendMessage = async () => {
        const trimmed = content.trim();
        if (!trimmed) return;
        setSending(true);
        try {
            // The REST call will trigger socket emit on the backend
            await api.post('/messages', { conversationId, content: trimmed });
            setContent('');
            const socket = getSocket();
            if (socket) socket.emit('stopTyping', { conversationId });
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="message-input-bar">
            <textarea
                id="message-input"
                className="message-textarea"
                placeholder="Type a message… (Enter to send)"
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending}
            />
            <button
                id="send-button"
                className="send-btn"
                onClick={sendMessage}
                disabled={sending || !content.trim()}
                title="Send message"
            >
                {sending ? <span className="spinner spinner-sm" /> : '➤'}
            </button>
        </div>
    );
}
