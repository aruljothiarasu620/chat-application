import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../sockets/socket';
import api from '../api/axios';
import MessageInput from './MessageInput';

export default function ChatWindow({ conversationId, otherUsername }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typingUser, setTypingUser] = useState(null);
    const bottomRef = useRef(null);
    const prevConvId = useRef(null);

    const getAvatarColor = (username) => {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
        let hash = 0;
        for (let c of (username || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    // Fetch messages on conversation change
    useEffect(() => {
        if (!conversationId) return;
        setLoading(true);
        setMessages([]);
        setTypingUser(null);

        api.get(`/conversations/${conversationId}/messages`)
            .then((res) => setMessages(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [conversationId]);

    // Socket.io — join room + listen for events
    useEffect(() => {
        if (!conversationId) return;
        const socket = getSocket();
        if (!socket) return;

        // Leave previous room
        if (prevConvId.current && prevConvId.current !== conversationId) {
            socket.emit('leaveConversation', prevConvId.current);
        }
        prevConvId.current = conversationId;

        socket.emit('joinConversation', conversationId);

        const onNewMessage = (msg) => {
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            setTypingUser(null);
        };

        const onTyping = ({ username }) => {
            if (username !== user.username) setTypingUser(username);
        };

        const onStopTyping = () => setTypingUser(null);

        socket.on('newMessage', onNewMessage);
        socket.on('userTyping', onTyping);
        socket.on('userStoppedTyping', onStopTyping);

        return () => {
            socket.off('newMessage', onNewMessage);
            socket.off('userTyping', onTyping);
            socket.off('userStoppedTyping', onStopTyping);
        };
    }, [conversationId, user.username]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUser]);

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (ts) => {
        const d = new Date(ts);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    // Group messages by date
    const grouped = [];
    let lastDate = null;
    for (const msg of messages) {
        const msgDate = new Date(msg.sent_at).toDateString();
        if (msgDate !== lastDate) {
            grouped.push({ type: 'separator', date: msg.sent_at });
            lastDate = msgDate;
        }
        grouped.push({ type: 'message', ...msg });
    }

    if (!conversationId) {
        return (
            <div className="chat-placeholder">
                <div className="chat-placeholder-inner">
                    <div className="placeholder-icon">💬</div>
                    <h2>Select a conversation</h2>
                    <p>Choose from your existing conversations or start a new one.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-window">
            {/* Chat header */}
            <div className="chat-header">
                <div className="avatar" style={{ background: getAvatarColor(otherUsername) }}>
                    {otherUsername?.[0]?.toUpperCase()}
                </div>
                <div className="chat-header-info">
                    <span className="chat-header-name">{otherUsername}</span>
                    <span className="chat-header-status">
                        {typingUser ? (
                            <span className="typing-status">{typingUser} is typing...</span>
                        ) : (
                            <span className="online-status">● Online</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
                {loading ? (
                    <div className="loading-msgs">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`skeleton-msg ${i % 2 === 0 ? 'right' : 'left'}`} />
                        ))}
                    </div>
                ) : grouped.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Say hi! 👋</p>
                    </div>
                ) : (
                    grouped.map((item, idx) =>
                        item.type === 'separator' ? (
                            <div key={`sep-${idx}`} className="date-separator">
                                <span>{formatDateSeparator(item.date)}</span>
                            </div>
                        ) : (
                            <div
                                key={item.id}
                                className={`message-row ${item.sender_id === user.id ? 'sent' : 'received'}`}
                            >
                                {item.sender_id !== user.id && (
                                    <div
                                        className="avatar avatar-xs"
                                        style={{ background: getAvatarColor(item.sender_username) }}
                                    >
                                        {item.sender_username?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div className="message-bubble-wrap">
                                    <div className="message-bubble">
                                        <p>{item.content}</p>
                                    </div>
                                    <span className="message-time">{formatTime(item.sent_at)}</span>
                                </div>
                            </div>
                        )
                    )
                )}

                {/* Typing indicator */}
                {typingUser && (
                    <div className="message-row received">
                        <div className="typing-indicator">
                            <span /><span /><span />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <MessageInput conversationId={conversationId} />
        </div>
    );
}
