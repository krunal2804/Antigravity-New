import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineCollection, HiOutlineTrash } from 'react-icons/hi';
import Breadcrumb from '../components/Breadcrumb';

export default function AssignmentsPage() {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ organization_id: '', name: '', location: '', description: '', start_date: '', end_date: '' });

    const fetchData = async () => {
        try {
            const [aRes, oRes] = await Promise.all([api.get('/assignments'), api.get('/organizations')]);
            setAssignments(aRes.data);
            setOrgs(oRes.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => { setEditItem(null); setForm({ organization_id: orgs[0]?.id || '', name: '', location: '', description: '', start_date: '', end_date: '' }); setShowModal(true); };
    const openEdit = (e, a) => { e.stopPropagation(); setEditItem(a); setForm({ organization_id: a.organization_id, name: a.name, location: a.location || '', description: a.description || '', start_date: a.start_date?.split('T')[0] || '', end_date: a.end_date?.split('T')[0] || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await api.put(`/assignments/${editItem.id}`, form);
            } else {
                await api.post('/assignments', form);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save assignment.');
        }
    };

    const handleDelete = async (e, a) => {
        e.stopPropagation();
        try {
            // Check for dependent projects first to show explicitly in the prompt
            const pRes = await api.get(`/projects?assignment_id=${a.id}`);
            const childProjects = pRes.data;
            
            let message = `Are you sure you want to delete assignment "${a.name}"?`;
            if (childProjects.length > 0) {
                message += `\n\nThis will also delete the following ${childProjects.length} project(s):\n`;
                childProjects.slice(0, 5).forEach(p => message += `- ${p.name}\n`);
                if (childProjects.length > 5) message += `- ...and ${childProjects.length - 5} more\n`;
            }

            if (!window.confirm(message)) return;

            await api.delete(`/assignments/${a.id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete assignment.');
        }
    };

    const getStatusBadge = (s) => {
        const m = { active: 'badge-success', on_hold: 'badge-warning', completed: 'badge-info', cancelled: 'badge-danger' };
        return m[s] || 'badge-default';
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <Breadcrumb items={[
                { label: 'Home', path: '/' },
                { label: 'Assignments', path: '/assignments' }
            ]} />
            <div className="table-container">
                <div className="table-header">
                    <h2>All Assignments ({assignments.length})</h2>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}><HiOutlinePlus /> Add Assignment</button>
                </div>

                {assignments.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Organization</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Projects</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a) => (
                                <tr key={a.id} onClick={() => navigate(`/assignments/${a.id}`, { state: { from: '/assignments' } })} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                                    <td>{a.organization_name}</td>
                                    <td>{a.location || '—'}</td>
                                    <td><span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span></td>
                                    <td><span className="badge badge-purple">{a.project_count}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-icon" onClick={(e) => openEdit(e, a)} title="Edit"><HiOutlinePencil /></button>
                                            <button className="btn-icon" onClick={(e) => handleDelete(e, a)} title="Delete" style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="icon"><HiOutlineCollection /></div>
                        <h3>No assignments yet</h3>
                        <p>Add an assignment (branch) under an organization to get started.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editItem ? 'Edit Assignment' : 'Add Assignment'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Organization *</label>
                                    <select className="form-control" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })} required>
                                        <option value="">Select Organization</option>
                                        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Assignment Name *</label>
                                        <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. TATA-Gujarat" />
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City or Plant Name" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
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
                                <button type="submit" className="btn btn-primary">{editItem ? 'Save Changes' : 'Add Assignment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
