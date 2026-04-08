import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { formatWorkflowStatus, getWorkflowStatusBadge } from '../utils/workflowStatus';
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
                <div className="icon">Under Construction</div>
                <h3>Welcome, {roleName}!</h3>
                <p>Your portal is coming soon. We're building features tailored for your role.</p>
            </div>
        </div>
    );
}

function ConsultingPortal({ user }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const todayKey = `welcome_dismissed_${user.id}_${new Date().toDateString()}`;
    const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem(todayKey));
    const dismissWelcome = () => {
        localStorage.setItem(todayKey, '1');
        setShowWelcome(false);
    };

    useEffect(() => {
        api.get('/dashboard/my-portal')
            .then((res) => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    const {
        assignments = [],
        counts = {},
        taskStats = { total: 0, completed: 0, in_progress: 0, overdue: 0, not_started: 0 },
        projectStatuses = [],
    } = data || {};

    const allProjects = assignments.flatMap((assignment) => assignment.projects || []);
    const activeProjects = allProjects.filter((project) => project.status === 'active' || project.status === 'not_started');

    const getProgressColor = (pct) => {
        if (pct >= 75) return 'green';
        if (pct >= 40) return 'orange';
        return 'purple';
    };

    return (
        <div className="fade-in">
            {showWelcome && (
                <div style={{
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}>
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>
                            Welcome back, {user.first_name}!
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
                            Here's your overview for today as a <span style={{ fontWeight: 700, color: '#fff' }}>{user.role_name}</span>.
                        </p>
                    </div>
                    <button
                        onClick={dismissWelcome}
                        title="Dismiss"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="stat-card">
                    <div className="stat-icon blue"><HiOutlineCollection /></div>
                    <div className="stat-info"><h3>{counts.active_projects || 0}</h3><p>Active Projects</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><HiOutlineClock /></div>
                    <div className="stat-info"><h3>{taskStats.total || 0}</h3><p>Total Tasks</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><HiOutlineCheckCircle /></div>
                    <div className="stat-info"><h3>{taskStats.completed || 0}</h3><p>Completed Tasks</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><HiOutlineExclamationCircle /></div>
                    <div className="stat-info">
                        <h3 style={taskStats.overdue > 0 ? { color: 'var(--danger)' } : {}}>{taskStats.overdue || 0}</h3>
                        <p>Overdue Tasks</p>
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
                            <div className="stat-icon blue" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineClock /></div>
                            <div><div style={{ fontSize: '22px', fontWeight: 800 }}>{taskStats.total}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Tasks</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon green" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineCheckCircle /></div>
                            <div><div style={{ fontSize: '22px', fontWeight: 800 }}>{taskStats.completed}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon orange" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineClock /></div>
                            <div><div style={{ fontSize: '22px', fontWeight: 800 }}>{taskStats.in_progress}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-icon red" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineExclamationCircle /></div>
                            <div><div style={{ fontSize: '22px', fontWeight: 800 }}>{taskStats.overdue}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div></div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Project Status Breakdown</span>
                    </div>
                    {projectStatuses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {projectStatuses.map((projectStatus) => (
                                <div key={projectStatus.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`badge ${getWorkflowStatusBadge(projectStatus.status)}`}>
                                        {formatWorkflowStatus(projectStatus.status).toUpperCase()}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '18px' }}>{projectStatus.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No projects yet.</p>
                    )}
                </div>
            </div>

            <div className="table-container" style={{ marginBottom: '28px' }}>
                <div className="table-header">
                    <h2>Active Projects ({activeProjects.length})</h2>
                </div>
                {activeProjects.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Assignment</th>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeProjects.map((project) => {
                                const total = project.task_total || 0;
                                const completed = project.task_completed || 0;
                                const progress = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;
                                const parentAssignment = assignments.find((assignment) => assignment.projects?.some((assignmentProject) => assignmentProject.id === project.id));
                                return (
                                    <tr key={project.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{parentAssignment?.name || '-'}</td>
                                        <td><span className="badge badge-purple">{project.service_name}</span></td>
                                        <td><span className={`badge ${getWorkflowStatusBadge(project.status)}`}>{formatWorkflowStatus(project.status)}</span></td>
                                        <td style={{ minWidth: '120px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="progress-bar" style={{ flex: 1 }}>
                                                    <div className={`fill ${getProgressColor(parseFloat(progress))}`} style={{ width: `${progress}%` }} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '36px' }}>{progress}%</span>
                                            </div>
                                            {project.task_overdue > 0 && <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginTop: '2px' }}>{project.task_overdue} overdue</div>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="icon"><HiOutlineClipboardList /></div>
                        <h3>No active projects</h3>
                        <p>You have no in-progress or pending projects at the moment.</p>
                    </div>
                )}
            </div>

            {(taskStats.not_started > 0 || taskStats.in_progress > 0 || taskStats.overdue > 0) && (
                <div className="card">
                    <div className="card-header"><span className="card-title">Pending Tasks Summary</span></div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '140px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <div className="stat-icon blue" style={{ width: '36px', height: '36px', fontSize: '16px' }}><HiOutlineClock /></div>
                            <div><div style={{ fontSize: '20px', fontWeight: 800 }}>{taskStats.in_progress}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '140px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <div className="stat-icon orange" style={{ width: '36px', height: '36px', fontSize: '16px' }}><HiOutlineClipboardList /></div>
                            <div><div style={{ fontSize: '20px', fontWeight: 800 }}>{taskStats.not_started}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not Started</div></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '140px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <div className="stat-icon red" style={{ width: '36px', height: '36px', fontSize: '16px' }}><HiOutlineExclamationCircle /></div>
                            <div><div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }}>{taskStats.overdue}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div></div>
                        </div>
                    </div>
                </div>
            )}

            {assignments.length === 0 && (
                <div className="empty-state" style={{ paddingTop: '60px' }}>
                    <div className="icon">Tasks</div>
                    <h3>No assignments yet</h3>
                    <p>You haven't been added to any assignments. Your manager will add you when a project begins.</p>
                </div>
            )}
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

    const getProgressColor = (pct) => {
        if (pct >= 75) return 'green';
        if (pct >= 40) return 'orange';
        return 'purple';
    };

    return (
        <div className="fade-in">
            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon purple"><HiOutlineOfficeBuilding /></div><div className="stat-info"><h3>{stats.counts.organizations}</h3><p>Organizations</p></div></div>
                <div className="stat-card"><div className="stat-icon blue"><HiOutlineCollection /></div><div className="stat-info"><h3>{stats.counts.assignments}</h3><p>Assignments</p></div></div>
                <div className="stat-card"><div className="stat-icon green"><HiOutlineClipboardList /></div><div className="stat-info"><h3>{stats.counts.projects}</h3><p>Projects</p></div></div>
                <div className="stat-card"><div className="stat-icon orange"><HiOutlineUsers /></div><div className="stat-info"><h3>{stats.counts.users}</h3><p>Team Members</p></div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <div className="card">
                    <div className="card-header"><span className="card-title">Task Overview</span></div>
                    <div className="stats-grid" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="stat-icon blue" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineClock /></div><div><div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.total}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Tasks</div></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="stat-icon green" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineCheckCircle /></div><div><div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.completed}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completed</div></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="stat-icon orange" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineClock /></div><div><div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.in_progress}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div className="stat-icon red" style={{ width: '40px', height: '40px', fontSize: '18px' }}><HiOutlineExclamationCircle /></div><div><div style={{ fontSize: '22px', fontWeight: 800 }}>{stats.taskStats.overdue}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div></div></div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><span className="card-title">Project Status Breakdown</span></div>
                    {stats.projectStatuses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.projectStatuses.map((projectStatus) => (
                                <div key={projectStatus.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className={`badge ${getWorkflowStatusBadge(projectStatus.status)}`}>{formatWorkflowStatus(projectStatus.status).toUpperCase()}</span>
                                    <span style={{ fontWeight: 700, fontSize: '18px' }}>{projectStatus.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No projects yet.</p>}
                </div>
            </div>

            <div className="table-container">
                <div className="table-header"><h2>Recent Projects</h2></div>
                {stats.recentProjects.length > 0 ? (
                    <table>
                        <thead>
                            <tr><th>Project</th><th>Organization</th><th>Service</th><th>Status</th><th>Progress</th></tr>
                        </thead>
                        <tbody>
                            {stats.recentProjects.map((project) => (
                                <tr key={project.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</td>
                                    <td>{project.organization_name} / {project.assignment_name}</td>
                                    <td><span className="badge badge-purple">{project.service_name}</span></td>
                                    <td><span className={`badge ${getWorkflowStatusBadge(project.status)}`}>{formatWorkflowStatus(project.status)}</span></td>
                                    <td style={{ minWidth: '120px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div className={`fill ${getProgressColor(parseFloat(project.progress_percentage))}`} style={{ width: `${project.progress_percentage}%` }} />
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '36px' }}>{parseFloat(project.progress_percentage).toFixed(0)}%</span>
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

    if (roleName === 'Consultant') return <ConsultingPortal user={user} />;
    if (roleName === 'Senior Consultant') return <ConsultingPortal user={user} />;

    return <FullDashboard />;
}
