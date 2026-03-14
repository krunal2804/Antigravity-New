import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlinePlus, HiOutlineX, HiOutlineClipboardList, HiOutlineEye, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import Breadcrumb from '../components/Breadcrumb';

export default function ProjectsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ assignment_id: '', service_id: '', name: '', description: '', start_date: '', end_date: '' });

    const fetchData = async () => {
        try {
            const [pRes, aRes, sRes] = await Promise.all([api.get('/projects'), api.get('/assignments'), api.get('/services')]);
            setProjects(pRes.data);
            setAssignments(aRes.data);
            setServices(sRes.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm({ assignment_id: assignments[0]?.id || '', service_id: services[0]?.id || '', name: '', description: '', start_date: '', end_date: '' });
        setShowModal(true);
    };

    const openEdit = (e, p) => {
        e.stopPropagation();
        setEditItem(p);
        setForm({ assignment_id: p.assignment_id, service_id: p.service_id, name: p.name, description: p.description || '', start_date: p.start_date?.split('T')[0] || '', end_date: p.end_date?.split('T')[0] || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await api.put(`/projects/${editItem.id}`, form);
            } else {
                await api.post('/projects', form);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save project.');
        }
    };

    const handleDelete = async (e, p) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete project "${p.name}"?`)) return;
        try {
            await api.delete(`/projects/${p.id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete project.');
        }
    };

    const getStatusBadge = (s) => {
        const m = { not_started: 'badge-default', in_progress: 'badge-info', on_hold: 'badge-warning', completed: 'badge-success', cancelled: 'badge-danger' };
        return m[s] || 'badge-default';
    };

    const getProgressColor = (pct) => {
        if (pct >= 75) return 'green';
        if (pct >= 40) return 'orange';
        return 'purple';
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <Breadcrumb items={[
                { label: 'Home', path: '/' },
                { label: 'Projects', path: '/projects' }
            ]} />
            <div className="table-container">
                <div className="table-header">
                    <h2>All Projects ({projects.length})</h2>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}><HiOutlinePlus /> New Project</button>
                </div>

                {projects.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Organization</th>
                                <th>Assignment</th>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Tasks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => (
                                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`, { state: { from: '/projects' } })} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                                    <td>{p.organization_name}</td>
                                    <td>{p.assignment_name}</td>
                                    <td><span className="badge badge-purple">{p.service_name}</span></td>
                                    <td><span className={`badge ${getStatusBadge(p.status)}`}>{p.status.replace(/_/g, ' ')}</span></td>
                                    <td style={{ minWidth: '120px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div className={`fill ${getProgressColor(parseFloat(p.progress_percentage))}`} style={{ width: `${p.progress_percentage}%` }} />
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{parseFloat(p.progress_percentage).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '12px' }}>
                                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{p.task_completed}</span>
                                            /{p.task_total}
                                            {p.task_overdue > 0 && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>({p.task_overdue} overdue)</span>}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-icon" onClick={(e) => openEdit(e, p)} title="Edit Project"><HiOutlinePencil /></button>
                                            <button className="btn-icon" onClick={(e) => handleDelete(e, p)} title="Delete Project" style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
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
                        <p>Create an organization and assignment first, then add your first project.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editItem ? 'Edit Project' : 'Create New Project'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Assignment *</label>
                                        <select className="form-control" value={form.assignment_id} onChange={(e) => setForm({ ...form, assignment_id: e.target.value })} required>
                                            <option value="">Select Assignment</option>
                                            {assignments.map((a) => <option key={a.id} value={a.id}>{a.organization_name} / {a.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Service Type *</label>
                                        <select className="form-control" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} required>
                                            <option value="">Select Service</option>
                                            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Project Name *</label>
                                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Time & Motion Study - Phase 1" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief project description" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="form-control" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editItem ? 'Save Changes' : 'Create Project'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
