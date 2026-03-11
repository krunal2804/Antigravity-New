import { useState, useEffect } from 'react';
import api from '../api';
import { HiOutlineUsers } from 'react-icons/hi';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users').then((r) => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <div className="table-container">
                <div className="table-header">
                    <h2>Team Members ({users.length})</h2>
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
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.role_side === 'consulting' ? 'linear-gradient(135deg, var(--accent), #a855f7)' : 'linear-gradient(135deg, var(--success), #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
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
                        <h3>No team members yet</h3>
                        <p>Register users to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
