import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineOfficeBuilding,
    HiOutlineCollection,
    HiOutlineClipboardList,
    HiOutlineUsers,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
} from 'react-icons/hi';

function EmptyDashboard({ roleName }) {
    return (
        <div className="fade-in">
            <div className="empty-state" style={{ paddingTop: '120px' }}>
                <div className="icon">🚧</div>
                <h3>Welcome, {roleName}!</h3>
                <p>Your portal is coming soon. We're building features tailored for your role.</p>
            </div>
        </div>
    );
}

function ConsultantDashboard({ user }) {
    return (
        <div className="fade-in">
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <span className="card-title">Welcome back, {user.first_name}!</span>
                    <span className="badge badge-info">{user.role_name}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Head over to <strong>My Tasks</strong> in the sidebar to view and complete your assigned tasks.
                </p>
            </div>
        </div>
    );
}

function SrConsultantDashboard({ user }) {
    return (
        <div className="fade-in">
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <span className="card-title">Welcome back, {user.first_name}!</span>
                    <span className="badge badge-purple">{user.role_name}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    View your assigned projects under <strong>My Projects</strong> in the sidebar.
                </p>
            </div>
        </div>
    );
}

function FullDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then((res) => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!stats) return null;

    const getStatusBadge = (status) => {
        const map = {
            not_started: 'badge-default',
            in_progress: 'badge-info',
            on_hold: 'badge-warning',
            completed: 'badge-success',
            cancelled: 'badge-danger',
        };
        return map[status] || 'badge-default';
    };

    const getProgressColor = (pct) => {
        if (pct >= 75) return 'green';
        if (pct >= 40) return 'orange';
        return 'purple';
    };

    return (
        <div className="fade-in">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><HiOutlineOfficeBuilding /></div>
                    <div className="stat-info">
                        <h3>{stats.counts.organizations}</h3>
                        <p>Organizations</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><HiOutlineCollection /></div>
                    <div className="stat-info">
                        <h3>{stats.counts.assignments}</h3>
                        <p>Assignments</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><HiOutlineClipboardList /></div>
                    <div className="stat-info">
                        <h3>{stats.counts.projects}</h3>
                        <p>Projects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><HiOutlineUsers /></div>
                    <div className="stat-info">
                        <h3>{stats.counts.users}</h3>
                        <p>Team Members</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Task Overview</span>
                    </div>
                    <div className="stats-grid" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon blue" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                <HiOutlineClock />
                            </div>
                            <div>
                                <div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.total}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Tasks</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon green" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                <HiOutlineCheckCircle />
                            </div>
                            <div>
                                <div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.completed}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon orange" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                <HiOutlineClock />
                            </div>
                            <div>
                                <div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.in_progress}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon red" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                <HiOutlineExclamationCircle />
                            </div>
                            <div>
                                <div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.overdue}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Project Status Breakdown</span>
                    </div>
                    {stats.projectStatuses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.projectStatuses.map((ps) => (
                                <div key={ps.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`badge ${getStatusBadge(ps.status)}`}>
                                        {ps.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '18px' }}>{ps.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No projects yet.</p>
                    )}
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2>Recent Projects</h2>
                </div>
                {stats.recentProjects.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Organization</th>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentProjects.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                                    <td>{p.organization_name} / {p.assignment_name}</td>
                                    <td><span className="badge badge-purple">{p.service_name}</span></td>
                                    <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status.replace(/_/g, ' ')}</span></td>
                                    <td style={{ minWidth: '120px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div
                                                    className={`fill ${getProgressColor(parseFloat(p.progress_percentage))}`}
                                                    style={{ width: `${p.progress_percentage}%` }}
                                                />
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '36px' }}>
                                                {parseFloat(p.progress_percentage).toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="icon"><HiOutlineClipboardList /></div>
                        <h3>No projects yet</h3>
                        <p>Create your first organization, then add assignments and projects to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const roleName = user?.role_name || '';

    if (roleName === 'Consultant') return <ConsultantDashboard user={user} />;
    if (roleName === 'Senior Consultant') return <SrConsultantDashboard user={user} />;

    // Director & Manager get the full dashboard
    return <FullDashboard />;
}
