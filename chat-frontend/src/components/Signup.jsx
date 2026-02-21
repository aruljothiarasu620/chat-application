import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            return setError('Passwords do not match');
        }
        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }
        setLoading(true);
        try {
            await api.post('/auth/register', {
                username: form.username,
                password: form.password,
            });
            navigate('/login', { state: { registered: true } });
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">💬</div>
                    <h1>Create account</h1>
                    <p>Join the conversation today</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-banner">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Choose a username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            minLength={3}
                            maxLength={50}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm">Confirm Password</label>
                        <input
                            id="confirm"
                            name="confirm"
                            type="password"
                            placeholder="Confirm your password"
                            value={form.confirm}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Create Account'}
                    </button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
