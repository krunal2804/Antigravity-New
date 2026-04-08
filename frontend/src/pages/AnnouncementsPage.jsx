import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineBell } from 'react-icons/hi';
import Breadcrumb from '../components/Breadcrumb';

export default function AnnouncementsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = () => {
        api.get('/notifications')
            .then(res => setNotifications(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const markAsOpened = (notification) => {
        if (!notification.is_read) {
            api.patch(`/notifications/${notification.id}/read`)
                .then(() => {
                    window.dispatchEvent(new Event('announcements_seen'));
                    // Update local state for immediate feedback
                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                })
                .catch(console.error);
        }
        
        if (notification.reference_type === 'assignment') {
            navigate(`/announcements/${notification.reference_id}`);
        }
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Announcements', path: '/announcements' }]} />
            <div className="table-container">
                <div className="table-header">
                    <h2>Recent Notifications ({notifications.length})</h2>
                </div>

                {notifications.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Notification</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map(n => {
                                const unopened = !n.is_read;
                                return (
                                    <tr
                                        key={n.id}
                                        style={{ 
                                            cursor: 'pointer',
                                            background: unopened ? 'rgba(37, 99, 235, 0.05)' : 'inherit'
                                        }}
                                        onClick={() => markAsOpened(n)}
                                    >
                                    <td style={{ 
                                        position: 'relative', 
                                        paddingLeft: unopened ? '28px' : '24px',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {unopened && (
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '15%',
                                                bottom: '15%',
                                                width: '4px',
                                                background: 'var(--accent)',
                                                borderRadius: '0 4px 4px 0'
                                            }} />
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: unopened ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: unopened ? 'var(--accent)' : 'var(--text-muted)'
                                            }}>
                                                <HiOutlineBell />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: unopened ? 800 : 600, color: unopened ? 'var(--accent)' : 'inherit' }}>
                                                    {n.title}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.message}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: unopened ? 600 : 400 }}>{formatDate(n.created_at)}</td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="icon"><HiOutlineBell /></div>
                        <h3>No announcements yet</h3>
                        <p>When you are added to a new assignment or team, you will see notifications here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
