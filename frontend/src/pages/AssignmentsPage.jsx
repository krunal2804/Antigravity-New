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
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState('');
    const [form, setForm] = useState({ 
        organization_id: '', name: '', location: '', description: '', start_date: '', end_date: '',
        faber_poc_id: '',
        top_management_name: '', top_management_designation: '', top_management_mobile: '', top_management_email: '',
        client_poc_name: '', client_poc_designation: '', client_poc_mobile: '', client_poc_email: '',
        schedule_type: 'month',
        consulting_team: [],    // [{ user_id, title }]
        period_count: 1,
        consulting_grid: [[]],  // grid[periodIndex][teamIndex] = days
        projects: [] 
    });

    const fetchData = async () => {
        try {
            const [aRes, oRes, sRes, uRes] = await Promise.all([
                api.get('/assignments'), 
                api.get('/organizations'),
                api.get('/services'),
                api.get('/users?role_side=consulting')
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
            schedule_type: 'month',
            consulting_team: [],
            period_count: 1,
            consulting_grid: [[]],
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
            schedule_type: a.schedule_type || 'month',
            consulting_team: [],
            period_count: 1,
            consulting_grid: [[]],
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

    // ─── Consulting Days helpers ───
    const handleToggleTeamMember = (userId) => {
        const exists = form.consulting_team.find(t => String(t.user_id) === String(userId));
        let newTeam;
        let newGrid;
        if (exists) {
            const idx = form.consulting_team.findIndex(t => String(t.user_id) === String(userId));
            newTeam = form.consulting_team.filter((_, i) => i !== idx);
            newGrid = form.consulting_grid.map(row => row.filter((_, i) => i !== idx));
        } else {
            const user = faberUsers.find(u => String(u.id) === String(userId));
            newTeam = [...form.consulting_team, { user_id: userId, title: user?.role_name || '' }];
            newGrid = form.consulting_grid.map(row => [...row, 0]);
        }
        setForm({ ...form, consulting_team: newTeam, consulting_grid: newGrid });
    };

    const handleTeamTitleChange = (idx, title) => {
        const newTeam = [...form.consulting_team];
        newTeam[idx] = { ...newTeam[idx], title };
        setForm({ ...form, consulting_team: newTeam });
    };

    const handlePeriodCountChange = (count) => {
        const c = Math.max(1, parseInt(count) || 1);
        const teamLen = form.consulting_team.length;
        const newGrid = Array.from({ length: c }, (_, pi) =>
            form.consulting_grid[pi] ? form.consulting_grid[pi].slice(0, teamLen).concat(Array(Math.max(0, teamLen - (form.consulting_grid[pi]?.length || 0))).fill(0)) : Array(teamLen).fill(0)
        );
        setForm({ ...form, period_count: c, consulting_grid: newGrid });
    };

    const handleGridDayChange = (periodIdx, teamIdx, value) => {
        const newGrid = form.consulting_grid.map(row => [...row]);
        newGrid[periodIdx][teamIdx] = parseInt(value) || 0;
        setForm({ ...form, consulting_grid: newGrid });
    };

    const getPeriodLabel = (idx) => {
        const prefix = form.schedule_type === 'workshop' ? 'Workshop' : 'Month';
        return `${prefix} ${idx + 1}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Flatten consulting days grid into API format
            const team_members = form.consulting_team.map(t => ({ user_id: t.user_id, title: t.title }));
            const consulting_days = [];
            form.consulting_grid.forEach((row, pi) => {
                row.forEach((days, ti) => {
                    if (form.consulting_team[ti]) {
                        consulting_days.push({
                            user_id: form.consulting_team[ti].user_id,
                            period_label: getPeriodLabel(pi),
                            period_index: pi,
                            days
                        });
                    }
                });
            });
            const payload = { ...form, team_members, consulting_days };

            if (editItem) {
                await api.put(`/assignments/${editItem.id}`, payload);
            } else {
                await api.post('/assignments', payload);
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
            {!showModal ? (
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
            ) : (
                <div className="form-container fade-in" style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: 'none', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{editItem ? 'Edit Assignment' : 'Add Assignment'}</h2>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}><HiOutlineX /> Cancel</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div>
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
                                    <div className="project-form-card">
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Top Management Details</h3>
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
                                    <div className="project-form-card">
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Point of Contact - Client</h3>
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

                                {/* Section 5: Consulting Days */}
                                <div style={{ marginBottom: '32px' }}>
                                    <div className="project-form-card">
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Consulting Days</h3>

                                        {/* Schedule Type Toggle */}
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <label>Schedule Type</label>
                                            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 400 }}>
                                                    <input type="radio" name="schedule_type" value="month" checked={form.schedule_type === 'month'} onChange={() => setForm({ ...form, schedule_type: 'month' })} />
                                                    Month Wise
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 400 }}>
                                                    <input type="radio" name="schedule_type" value="workshop" checked={form.schedule_type === 'workshop'} onChange={() => setForm({ ...form, schedule_type: 'workshop' })} />
                                                    Workshop Wise
                                                </label>
                                            </div>
                                        </div>

                                        {/* Number of Periods */}
                                        <div className="form-group" style={{ marginBottom: '16px', maxWidth: '200px' }}>
                                            <label>Number of {form.schedule_type === 'workshop' ? 'Workshops' : 'Months'}</label>
                                            <input type="number" className="form-control" min="1" value={form.period_count} onChange={(e) => handlePeriodCountChange(e.target.value)} />
                                        </div>

                                        {/* Team Member Selector */}
                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <label>Select Team Members</label>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                <select
                                                    className="form-control"
                                                    value={selectedTeamMemberId}
                                                    onChange={(e) => setSelectedTeamMemberId(e.target.value)}
                                                >
                                                    <option value="">Select a member...</option>
                                                    {faberUsers
                                                        .filter(u => !form.consulting_team.some(t => String(t.user_id) === String(u.id)))
                                                        .map(u => (
                                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                                                        ))
                                                    }
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
                                                    disabled={!selectedTeamMemberId}
                                                    onClick={() => {
                                                        if (selectedTeamMemberId) {
                                                            const exists = form.consulting_team.some(t => String(t.user_id) === String(selectedTeamMemberId));
                                                            if (!exists) {
                                                                handleToggleTeamMember(parseInt(selectedTeamMemberId, 10));
                                                            }
                                                            setSelectedTeamMemberId('');
                                                        }
                                                    }}
                                                >
                                                    <HiOutlinePlus size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Title inputs for selected members */}
                                        {form.consulting_team.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <label style={{ marginBottom: '8px', display: 'block' }}>Team Titles</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                                    {form.consulting_team.map((member, idx) => {
                                                        const user = faberUsers.find(u => String(u.id) === String(member.user_id));
                                                        return (
                                                            <div key={member.user_id} style={{ flex: '1 1 200px', minWidth: '180px' }}>
                                                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                                                                    <span>{user ? `${user.first_name} ${user.last_name}` : 'User'}</span>
                                                                    <button type="button" onClick={() => handleToggleTeamMember(member.user_id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }} title="Remove Team Member">
                                                                        <HiOutlineX size={16} />
                                                                    </button>
                                                                </div>
                                                                <input className="form-control" value={member.title} onChange={(e) => handleTeamTitleChange(idx, e.target.value)} placeholder="e.g. Industrial Engineer" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Consulting Days Grid */}
                                        {form.consulting_team.length > 0 && form.period_count > 0 && (
                                            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                    <thead>
                                                        <tr style={{ background: 'var(--bg-secondary)' }}>
                                                            <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                {form.schedule_type === 'workshop' ? 'Workshop' : 'Month'}
                                                            </th>
                                                            {form.consulting_team.map((member, ti) => (
                                                                <th key={ti} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid var(--border)', fontWeight: 600, minWidth: '100px' }}>
                                                                    {member.title || `Member ${ti + 1}`}
                                                                </th>
                                                            ))}
                                                            <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid var(--border)', fontWeight: 700, background: 'var(--bg-secondary)' }}>
                                                                Total
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {form.consulting_grid.map((row, pi) => (
                                                            <tr key={pi} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                <td style={{ padding: '8px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{getPeriodLabel(pi)}</td>
                                                                {row.map((days, ti) => (
                                                                    <td key={ti} style={{ padding: '4px 8px', textAlign: 'center' }}>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={days}
                                                                            onChange={(e) => handleGridDayChange(pi, ti, e.target.value)}
                                                                            style={{
                                                                                width: '60px',
                                                                                textAlign: 'center',
                                                                                padding: '6px 4px',
                                                                                border: '1px solid var(--border)',
                                                                                borderRadius: '6px',
                                                                                background: 'var(--bg-primary)',
                                                                                color: 'var(--text-primary)',
                                                                                fontSize: '13px'
                                                                            }}
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>
                                                                    {row.reduce((sum, d) => sum + d, 0)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Totals Row */}
                                                        <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                                            <td style={{ padding: '10px 12px' }}>Total</td>
                                                            {form.consulting_team.map((_, ti) => (
                                                                <td key={ti} style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                                    {form.consulting_grid.reduce((sum, row) => sum + (row[ti] || 0), 0)}
                                                                </td>
                                                            ))}
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                                                {form.consulting_grid.reduce((total, row) => total + row.reduce((s, d) => s + d, 0), 0)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
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
                                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                                    <label>Key Deliverables and Scope of Work</label>
                                                    <textarea 
                                                        className="form-control" 
                                                        rows="2" 
                                                        value={proj.description || ''} 
                                                        onChange={(e) => handleProjectChange(idx, 'description', e.target.value)} 
                                                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                                        style={{ resize: 'vertical', overflow: 'hidden' }}
                                                        placeholder="Enter deliverables and scope..." 
                                                    />
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Tentative Flagoff Date</label>
                                                        <input type="date" className="form-control" value={proj.start_date || ''} onChange={(e) => handleProjectChange(idx, 'start_date', e.target.value)} />
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">{editItem ? 'Save Changes' : 'Add Assignment'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
