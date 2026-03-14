import { useState, useEffect } from 'react';
import api from '../api';
import { HiOutlineUsers, HiOutlinePlus } from 'react-icons/hi';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', password: '', role_id: '', phone: '',
    });

    useEffect(() => {
        Promise.all([
            api.get('/users'),
            api.get('/users/roles'),
        ])
            .then(([usersRes, rolesRes]) => {
                setUsers(usersRes.data);
                setRoles(rolesRes.data.filter((r) => r.side === 'consulting'));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const res = await api.post('/users', {
                ...form,
                role_id: parseInt(form.role_id),
            });
            setUsers([...users, res.data]);
            setShowModal(false);
            setForm({ first_name: '', last_name: '', email: '', password: '', role_id: '', phone: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <div className="table-container">
                <div className="table-header">
                    <h2>Users ({users.length})</h2>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <HiOutlinePlus /> Add User
                    </button>
                </div>

                {users.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Side</th>
                                <th>Organization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.role_side === 'consulting' ? 'var(--accent)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                {u.first_name[0]}{u.last_name[0]}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.first_name} {u.last_name}</span>
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td><span className="badge badge-purple">{u.role_name}</span></td>
                                    <td><span className={`badge ${u.role_side === 'consulting' ? 'badge-info' : 'badge-success'}`}>{u.role_side}</span></td>
                                    <td>{u.organization_name || '— (Consulting)'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="icon"><HiOutlineUsers /></div>
                        <h3>No users yet</h3>
                        <p>Click "Add User" to create a new team member.</p>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New User</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="login-error">{error}</div>}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input
                                            className="form-control"
                                            value={form.first_name}
                                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name *</label>
                                        <input
                                            className="form-control"
                                            value={form.last_name}
                                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            className="form-control"
                                            value={form.role_id}
                                            onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select role...</option>
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            className="form-control"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
