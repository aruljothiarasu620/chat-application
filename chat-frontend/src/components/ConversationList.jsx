import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ConversationList({ selectedId, onSelect }) {
    const { user, logout } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUsername, setNewUsername] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        // Poll every 10s for new conversations
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    const startConversation = async (e) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const res = await api.post('/conversations', { username: newUsername });
            setNewUsername('');
            setShowNewChat(false);
            await fetchConversations();
            onSelect(res.data.id, newUsername);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not start conversation');
        } finally {
            setCreating(false);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 86400000) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getInitial = (username) => username ? username[0].toUpperCase() : '?';

    const getAvatarColor = (username) => {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
        let hash = 0;
        for (let c of username) hash = c.charCodeAt(0) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-title">
                    <span className="logo-icon">💬</span>
                    <span>Chatter</span>
                </div>
                <div className="sidebar-actions">
                    <button
                        className="icon-btn"
                        title="New conversation"
                        onClick={() => { setShowNewChat(!showNewChat); setError(''); }}
                    >
                        ✏️
                    </button>
                    <button className="icon-btn" title="Logout" onClick={logout}>
                        🚪
                    </button>
                </div>
            </div>

            {/* Current user */}
            <div className="current-user">
                <div
                    className="avatar avatar-sm"
                    style={{ background: getAvatarColor(user?.username || '') }}
                >
                    {getInitial(user?.username || '')}
                </div>
                <span className="current-username">{user?.username}</span>
                <span className="online-dot" />
            </div>

            {/* New chat form */}
            {showNewChat && (
                <form className="new-chat-form" onSubmit={startConversation}>
                    <input
                        type="text"
                        placeholder="Username to message..."
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        autoFocus
                        required
                    />
                    {error && <span className="new-chat-error">{error}</span>}
                    <button type="submit" disabled={creating} className="btn-primary btn-sm">
                        {creating ? '...' : 'Start Chat'}
                    </button>
                </form>
            )}

            {/* Conversation list */}
            <div className="conversation-list">
                {loading ? (
                    <div className="list-placeholder">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton-row" />
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👋</div>
                        <p>No conversations yet</p>
                        <small>Click ✏️ to start chatting</small>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`conv-item ${selectedId === conv.id ? 'active' : ''}`}
                            onClick={() => onSelect(conv.id, conv.other_username)}
                        >
                            <div
                                className="avatar"
                                style={{ background: getAvatarColor(conv.other_username || '') }}
                            >
                                {getInitial(conv.other_username || '')}
                            </div>
                            <div className="conv-info">
                                <div className="conv-top">
                                    <span className="conv-name">{conv.other_username}</span>
                                    <span className="conv-time">{formatTime(conv.last_message_at)}</span>
                                </div>
                                <span className="conv-preview">
                                    {conv.last_message || 'No messages yet'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
