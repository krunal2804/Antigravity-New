import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../api';
import Breadcrumb from '../components/Breadcrumb';
import {
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineExclamationCircle,
    HiOutlineClipboardList,
    HiOutlineDocumentText
} from 'react-icons/hi';

export default function ProjectDetailPage() {
    const { id } = useParams();
    const location = useLocation();
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

    const fromPath = location.state?.from || '/clients';

    const getBreadcrumbItems = () => {
        if (fromPath === '/projects') {
            return [
                { label: 'Home', path: '/' },
                { label: 'Projects', path: '/projects' },
                { label: project.name, path: `/projects/${project.id}`, state: { from: '/projects' } }
            ];
        }
        if (fromPath === '/assignments') {
            return [
                { label: 'Home', path: '/' },
                { label: 'Assignments', path: '/assignments' },
                { label: project.assignment_name, path: `/assignments/${project.assignment_id}`, state: { from: '/assignments' } },
                { label: project.name, path: `/projects/${project.id}`, state: { from: '/assignments' } }
            ];
        }
        if (fromPath === '/my-projects') {
             return [
                 { label: 'Home', path: '/' },
                 { label: 'My Projects', path: '/my-projects' },
                 { label: project.name, path: `/projects/${project.id}`, state: { from: '/my-projects' } }
             ];
        }
        
        // Default Client hierarchy
        return [
            { label: 'Home', path: '/' },
            { label: 'Clients', path: '/clients' },
            { label: project.organization_name, path: `/clients/${project.organization_id || ''}` },
            { label: project.assignment_name, path: `/assignments/${project.assignment_id}`, state: { from: '/clients' } },
            { label: project.name, path: `/projects/${project.id}`, state: { from: '/clients' } }
        ];
    };

    return (
        <div className="fade-in">
            <Breadcrumb items={getBreadcrumbItems()} />

            <div className="detail-header" style={{ marginBottom: '24px' }}>
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
                        <div style={{ padding: '12px' }}>
                            {/* Grouping Logic */}
                            {(() => {
                                const groups = {};
                                project.tasks.forEach(t => {
                                    const name = t.step_name || 'Other';
                                    if (!groups[name]) groups[name] = [];
                                    groups[name].push(t);
                                });
                                // Keep 'Other' at the end
                                const stepNames = Object.keys(groups).sort((a, b) => {
                                    if (a === 'Other') return 1;
                                    if (b === 'Other') return -1;
                                    return 0;
                                });

                                return stepNames.length > 0 ? stepNames.map((stepName) => (
                                    <div key={stepName} style={{ marginBottom: '24px' }}>
                                        <div style={{ 
                                            background: 'var(--bg-secondary)', 
                                            padding: '12px 16px', 
                                            borderRadius: 'var(--radius-md)', 
                                            fontWeight: 700, 
                                            fontSize: '14px', 
                                            color: 'var(--text-primary)',
                                            marginBottom: '12px'
                                        }}>
                                            {stepName}
                                        </div>
                                        <div className="task-list">
                                            {groups[stepName].map((task) => (
                                                <div className="task-item" key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
                                                        <div style={{ cursor: 'default' }}>
                                                            {getTaskStatusIcon(task.status, task.due_date)}
                                                        </div>
                                                        <div className="task-order">{task.sequence_order}</div>
                                                        <div className="task-info" style={{ flex: 1 }}>
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
                                                    
                                                    {/* Reference Documents Display */}
                                                    {task.documents?.length > 0 && (
                                                        <div style={{ marginLeft: 0, marginTop: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Standard for reference:</span>
                                                            {task.documents.map(doc => (
                                                                <a 
                                                                    key={doc.id} 
                                                                    href={doc.file_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    style={{ 
                                                                        display: 'inline-flex', 
                                                                        alignItems: 'center', 
                                                                        gap: '6px', 
                                                                        fontSize: '13px',
                                                                        fontWeight: 600,
                                                                        padding: '6px 12px',
                                                                        background: 'var(--bg-hover)',
                                                                        color: 'var(--text-primary)',
                                                                        border: '1px solid var(--border)',
                                                                        borderRadius: '6px',
                                                                        textDecoration: 'none',
                                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                                    }}
                                                                >
                                                                    <HiOutlineDocumentText size={16} /> {doc.name}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No tasks assigned to this project yet.
                                    </div>
                                );
                            })()}
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
