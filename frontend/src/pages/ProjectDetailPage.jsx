import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineExclamationCircle,
    HiOutlineClipboardList,
} from 'react-icons/hi';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProject = () => {
        api.get(`/projects/${id}`)
            .then((r) => setProject(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(fetchProject, [id]);

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            fetchProject();
        } catch (err) {
            alert('Failed to update task status.');
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

    const completed = project.tasks.filter((t) => t.status === 'completed').length;
    const total = project.tasks.length;
    const overdue = project.tasks.filter((t) => {
        if (t.status === 'completed' || t.status === 'skipped') return false;
        return t.due_date && new Date(t.due_date) < new Date();
    }).length;
    const progress = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    const getTaskStatusIcon = (s, dueDate) => {
        if (s === 'completed') return <HiOutlineCheckCircle style={{ color: 'var(--success)', fontSize: '20px' }} />;
        if (s === 'in_progress') return <HiOutlineClock style={{ color: 'var(--info)', fontSize: '20px' }} />;
        if (s === 'overdue' || (dueDate && new Date(dueDate) < new Date() && s !== 'skipped')) return <HiOutlineExclamationCircle style={{ color: 'var(--danger)', fontSize: '20px' }} />;
        return <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border)' }} />;
    };

    const statusOptions = ['not_started', 'in_progress', 'completed', 'overdue', 'skipped'];

    return (
        <div className="fade-in">
            <div className="detail-header">
                <div className="breadcrumb">
                    <Link to="/projects"><HiOutlineArrowLeft style={{ verticalAlign: 'middle' }} /> Back to Projects</Link>
                    {' / '}{project.organization_name}{' / '}{project.assignment_name}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{project.name}</h1>
                <div className="detail-meta">
                    <div className="meta-item"><strong>Service:</strong> <span className="badge badge-purple" style={{ marginLeft: '6px' }}>{project.service_name}</span></div>
                    <div className="meta-item"><strong>Status:</strong> <span className={`badge ${project.status === 'completed' ? 'badge-success' : project.status === 'in_progress' ? 'badge-info' : 'badge-default'}`} style={{ marginLeft: '6px' }}>{project.status.replace(/_/g, ' ')}</span></div>
                    {project.start_date && <div className="meta-item"><strong>Start:</strong> {new Date(project.start_date).toLocaleDateString()}</div>}
                    {project.end_date && <div className="meta-item"><strong>End:</strong> {new Date(project.end_date).toLocaleDateString()}</div>}
                </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className="stat-card">
                    <div className="stat-icon purple"><HiOutlineClipboardList /></div>
                    <div className="stat-info"><h3>{total}</h3><p>Total Tasks</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><HiOutlineCheckCircle /></div>
                    <div className="stat-info"><h3>{completed}</h3><p>Completed</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><HiOutlineExclamationCircle /></div>
                    <div className="stat-info"><h3>{overdue}</h3><p>Overdue</p></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><HiOutlineClock /></div>
                    <div className="stat-info"><h3>{progress}%</h3><p>Progress</p></div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Overall Progress</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>{progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: '10px' }}>
                    <div className={`fill ${parseFloat(progress) >= 75 ? 'green' : parseFloat(progress) >= 40 ? 'orange' : 'purple'}`} style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="detail-grid">
                <div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                            <span className="card-title">Project Tasks ({total})</span>
                        </div>
                        <div className="task-list" style={{ padding: '12px' }}>
                            {project.tasks.map((task) => (
                                <div className="task-item" key={task.id}>
                                    <div style={{ cursor: 'default' }}>
                                        {getTaskStatusIcon(task.status, task.due_date)}
                                    </div>
                                    <div className="task-order">{task.sequence_order}</div>
                                    <div className="task-info">
                                        <h4 style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.7 : 1 }}>
                                            {task.name}
                                        </h4>
                                        <p>
                                            {task.due_date && `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                            {task.assignee_first_name && ` • ${task.assignee_first_name} ${task.assignee_last_name}`}
                                        </p>
                                    </div>
                                    <select
                                        className="task-status-select"
                                        value={task.status}
                                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                    >
                                        {statusOptions.map((s) => (
                                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header">
                            <span className="card-title">Team Members ({project.members.length})</span>
                        </div>
                        {project.members.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {project.members.map((m) => (
                                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.side === 'consulting' ? 'linear-gradient(135deg, var(--accent), #a855f7)' : 'linear-gradient(135deg, var(--success), #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white' }}>
                                            {m.first_name[0]}{m.last_name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.first_name} {m.last_name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.role_name} • {m.side}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No members assigned yet.</p>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Timeline</span>
                        </div>
                        {project.timeline.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {project.timeline.map((e) => (
                                    <div key={e.id} style={{ display: 'flex', gap: '12px', paddingLeft: '12px', borderLeft: '2px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{e.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {new Date(e.event_date).toLocaleDateString()} • {e.event_type}
                                                {e.created_by_name && ` • ${e.created_by_name}`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No events yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
