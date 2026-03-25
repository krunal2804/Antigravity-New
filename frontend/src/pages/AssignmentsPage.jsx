import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineCollection, HiOutlineTrash } from 'react-icons/hi';
import Breadcrumb from '../components/Breadcrumb';

export default function AssignmentsPage() {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [faberUsers, setFaberUsers] = useState([]);
    const [form, setForm] = useState({ 
        organization_id: '', name: '', location: '', description: '', start_date: '', end_date: '',
        faber_poc_id: '',
        top_management_name: '', top_management_designation: '', top_management_mobile: '', top_management_email: '',
        client_poc_name: '', client_poc_designation: '', client_poc_mobile: '', client_poc_email: '',
        projects: [] 
    });

    const fetchData = async () => {
        try {
            const [aRes, oRes, sRes, uRes] = await Promise.all([
                api.get('/assignments'), 
                api.get('/organizations'),
                api.get('/services'),
                api.get('/users?role_side=faber')
            ]);
            setAssignments(aRes.data);
            setOrgs(oRes.data);
            setServices(sRes.data);
            setFaberUsers(uRes.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const getEmptyProject = () => ({ name: '', service_id: '', description: '', start_date: '', end_date: '', project_code: '' });

    const openAdd = () => { 
        setEditItem(null); 
        setForm({ 
            organization_id: orgs[0]?.id || '', name: '', location: '', description: '', start_date: '', end_date: '',
            faber_poc_id: '',
            top_management_name: '', top_management_designation: '', top_management_mobile: '', top_management_email: '',
            client_poc_name: '', client_poc_designation: '', client_poc_mobile: '', client_poc_email: '',
            projects: [getEmptyProject()]
        }); 
        setShowModal(true); 
    };

    const openEdit = (e, a) => { 
        e.stopPropagation(); 
        setEditItem(a); 
        setForm({ 
            organization_id: a.organization_id, name: a.name, location: a.location || '', description: a.description || '', start_date: a.start_date?.split('T')[0] || '', end_date: a.end_date?.split('T')[0] || '',
            faber_poc_id: a.faber_poc_id || '',
            top_management_name: a.top_management_name || '', top_management_designation: a.top_management_designation || '', top_management_mobile: a.top_management_mobile || '', top_management_email: a.top_management_email || '',
            client_poc_name: a.client_poc_name || '', client_poc_designation: a.client_poc_designation || '', client_poc_mobile: a.client_poc_mobile || '', client_poc_email: a.client_poc_email || '',
            projects: [] // Hide project form on edit
        }); 
        setShowModal(true); 
    };

    const handleProjectChange = (index, field, value) => {
        const newProjects = [...form.projects];
        newProjects[index][field] = value;
        setForm({ ...form, projects: newProjects });
    };

    const addProjectField = () => setForm({ ...form, projects: [...form.projects, getEmptyProject()] });
    const removeProjectField = (index) => {
        const newProjects = form.projects.filter((_, i) => i !== index);
        setForm({ ...form, projects: newProjects });
    };

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
                                {/* Top Layout */}
                                <div className="form-group">
                                    <label>1. Client Name *</label>
                                    <select className="form-control" value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })} required>
                                        <option value="">Select Client</option>
                                        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assignment Name *</label>
                                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. TATA-Gujarat" />
                                </div>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label>2. Site Address (For Consulting Intervention)</label>
                                    <input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City or Plant Name" />
                                </div>

                                <div className="form-group" style={{ marginBottom: '32px' }}>
                                    <label>3. Point of Contact - Faber Infinite</label>
                                    <select className="form-control" value={form.faber_poc_id} onChange={(e) => setForm({ ...form, faber_poc_id: e.target.value })}>
                                        <option value="">Select Faber Contact</option>
                                        {faberUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                                    </select>
                                </div>

                                {/* Section 3: Top Management Details */}
                                <div style={{ marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Top Management Details</h3>
                                    <div className="project-form-card">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Name</label>
                                                <input className="form-control" value={form.top_management_name} onChange={(e) => setForm({ ...form, top_management_name: e.target.value })} placeholder="Name" />
                                            </div>
                                            <div className="form-group">
                                                <label>Designation</label>
                                                <input className="form-control" value={form.top_management_designation} onChange={(e) => setForm({ ...form, top_management_designation: e.target.value })} placeholder="Designation" />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Mobile/ Board Line No.</label>
                                                <input className="form-control" value={form.top_management_mobile} onChange={(e) => setForm({ ...form, top_management_mobile: e.target.value })} placeholder="Phone Number" />
                                            </div>
                                            <div className="form-group">
                                                <label>E-mail ID</label>
                                                <input type="email" className="form-control" value={form.top_management_email} onChange={(e) => setForm({ ...form, top_management_email: e.target.value })} placeholder="Email Address" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Point of Contact - Client */}
                                <div style={{ marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Point of Contact - Client</h3>
                                    <div className="project-form-card">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Name</label>
                                                <input className="form-control" value={form.client_poc_name} onChange={(e) => setForm({ ...form, client_poc_name: e.target.value })} placeholder="Name" />
                                            </div>
                                            <div className="form-group">
                                                <label>Designation</label>
                                                <input className="form-control" value={form.client_poc_designation} onChange={(e) => setForm({ ...form, client_poc_designation: e.target.value })} placeholder="Designation" />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Mobile/ Board Line No.</label>
                                                <input className="form-control" value={form.client_poc_mobile} onChange={(e) => setForm({ ...form, client_poc_mobile: e.target.value })} placeholder="Phone Number" />
                                            </div>
                                            <div className="form-group">
                                                <label>E-mail ID</label>
                                                <input type="email" className="form-control" value={form.client_poc_email} onChange={(e) => setForm({ ...form, client_poc_email: e.target.value })} placeholder="Email Address" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!editItem && (
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Projects</h3>
                                        {form.projects.map((proj, idx) => (
                                            <div key={idx} className="project-form-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Project {idx + 1}</h4>
                                                    {form.projects.length > 1 && (
                                                        <button type="button" onClick={() => removeProjectField(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Remove Project">
                                                            <HiOutlineTrash size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Project Name *</label>
                                                        <input className="form-control" value={proj.name} onChange={(e) => handleProjectChange(idx, 'name', e.target.value)} required placeholder="e.g. Implementation Phase" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Service Type *</label>
                                                        <select className="form-control" value={proj.service_id} onChange={(e) => handleProjectChange(idx, 'service_id', e.target.value)} required>
                                                            <option value="">Select Service</option>
                                                            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Start Date</label>
                                                        <input type="date" className="form-control" value={proj.start_date || ''} onChange={(e) => handleProjectChange(idx, 'start_date', e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>End Date</label>
                                                        <input type="date" className="form-control" value={proj.end_date || ''} onChange={(e) => handleProjectChange(idx, 'end_date', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="add-project-btn" onClick={addProjectField}>
                                            <HiOutlinePlus size={20} /> Add Another Project
                                        </button>
                                    </div>
                                )}
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
