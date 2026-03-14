import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { HiOutlineLockClosed, HiOutlineUser, HiOutlineMail, HiOutlineShieldCheck } from 'react-icons/hi';

export default function SettingsPage() {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (passwords.new_password !== passwords.confirm_password) {
            setError('New passwords do not match.');
            return;
        }
        if (passwords.new_password.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }

        setSaving(true);
        try {
            const res = await api.put('/auth/password', {
                current_password: passwords.current_password,
                new_password: passwords.new_password,
            });
            setMessage(res.data.message);
            setPasswords({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in">
            {/* Profile Info Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <span className="card-title">Profile Information</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="stat-icon blue" style={{ width: '40px', height: '40px', fontSize: '16px' }}><HiOutlineUser /></div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{user?.first_name} {user?.last_name}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="stat-icon purple" style={{ width: '40px', height: '40px', fontSize: '16px' }}><HiOutlineMail /></div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{user?.email}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="stat-icon green" style={{ width: '40px', height: '40px', fontSize: '16px' }}><HiOutlineShieldCheck /></div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Role</div>
                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{user?.role_name}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title"><HiOutlineLockClosed style={{ verticalAlign: 'middle', marginRight: '8px' }} />Change Password</span>
                </div>

                {message && <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', marginBottom: '20px' }}>{message}</div>}
                {error && <div className="login-error" style={{ marginBottom: '20px' }}>{error}</div>}

                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Current Password *</label>
                        <input
                            type="password"
                            className="form-control"
                            value={passwords.current_password}
                            onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>New Password *</label>
                            <input
                                type="password"
                                className="form-control"
                                value={passwords.new_password}
                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password *</label>
                            <input
                                type="password"
                                className="form-control"
                                value={passwords.confirm_password}
                                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
