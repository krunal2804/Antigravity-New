import { useState, useEffect } from 'react';
import api from '../api';
import { 
    HiOutlinePlus, HiOutlineTrash, HiOutlineCollection, 
    HiOutlineDocumentAdd, HiOutlineX, HiOutlinePaperClip
} from 'react-icons/hi';

function toRoman(num) {
    if (num === 0) return '0';
    const roman = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
}

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [serviceDetails, setServiceDetails] = useState(null);
    
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [sRes, dRes] = await Promise.all([
                api.get('/services'),
                api.get('/services/reference_documents/all')
            ]);
            setServices(sRes.data);
            setDocs(dRes.data);
            if (!selectedServiceId && sRes.data.length > 0) {
                setSelectedServiceId(sRes.data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const loadServiceDetails = async (id) => {
        try {
            const res = await api.get(`/services/${id}`);
            setServiceDetails(res.data);
        } catch (e) {
            console.error("Failed to load details");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedServiceId) {
            loadServiceDetails(selectedServiceId);
        }
    }, [selectedServiceId]);

    // UI Modals
    const [modalConfig, setModalConfig] = useState(null); // { type: 'service'|'step'|'task'|'doc', parentId: null, editData: null }
    const [form, setForm] = useState({});

    const openModal = (type, parentId, editData = null) => {
        setModalConfig({ type, parentId, editData });
        if (type === 'service') setForm(editData || { name: '', code: '', description: '' });
        if (type === 'step') setForm(editData || { name: '', description: '' });
        if (type === 'task') setForm(editData || { name: '', description: '', default_duration_days: '' });
        if (type === 'doc') setForm({ document_id: '' });
        if (type === 'doc_create') setForm({ name: '', file_url: '', description: '' });
    };

    const closeModal = () => setModalConfig(null);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const { type, parentId } = modalConfig;
            
            // Validate Empty Fields
            if (type === 'service' && (!form.name.trim() || !form.code.trim())) return alert("Name and Code are required.");
            if (type === 'task' && !form.name.trim()) return alert("Task name is required.");
            if (type === 'doc' && !form.document_id) return alert("Please select a document.");
            if (type === 'doc_create' && (!form.name.trim() || !form.file_url.trim())) return alert("Name and File URL are required.");

            if (type === 'service') {
                if (modalConfig.editData) await api.put(`/services/${modalConfig.editData.id}`, form);
                else {
                    const res = await api.post('/services', form);
                    setSelectedServiceId(res.data.id);
                }
                fetchData();
            } else if (type === 'step') {
                if (modalConfig.editData) await api.put(`/services/steps/${modalConfig.editData.id}`, form);
                else await api.post(`/services/${parentId}/steps`, form);
                loadServiceDetails(selectedServiceId);
            } else if (type === 'task') {
                if (modalConfig.editData) await api.put(`/services/tasks/${modalConfig.editData.id}`, form);
                else await api.post(`/services/steps/${parentId}/tasks`, form);
                loadServiceDetails(selectedServiceId);
            } else if (type === 'doc') {
                await api.post(`/services/tasks/${parentId}/documents`, form);
                loadServiceDetails(selectedServiceId);
            } else if (type === 'doc_create') {
                await api.post(`/services/reference_documents`, form);
                fetchData(); // reload docs list
            }
            closeModal();
        } catch (err) {
            alert(err.response?.data?.error || "An error occurred.");
        }
    };

    const handleDelete = async (type, id, parentId = null) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            if (type === 'service') {
                await api.delete(`/services/${id}`);
                setSelectedServiceId(null);
                fetchData();
            } else if (type === 'step') {
                await api.delete(`/services/steps/${id}`);
                loadServiceDetails(selectedServiceId);
            } else if (type === 'task') {
                await api.delete(`/services/tasks/${id}`);
                loadServiceDetails(selectedServiceId);
            } else if (type === 'doc') {
                await api.delete(`/services/tasks/${parentId}/documents/${id}`);
                loadServiceDetails(selectedServiceId);
            }
        } catch(e) {
            alert("Delete failed.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 100px)' }}>
            {/* Sidebar List */}
            <div style={{ width: '300px', flexShrink: 0, background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Services</h2>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal('service')}><HiOutlinePlus/> Add</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {services.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => setSelectedServiceId(s.id)}
                            style={{ 
                                padding: '16px 20px', 
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                background: selectedServiceId === s.id ? 'var(--bg-secondary)' : 'transparent',
                                borderLeft: selectedServiceId === s.id ? '3px solid var(--primary)' : '3px solid transparent'
                            }}
                        >
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Code: {s.code}</div>
                        </div>
                    ))}
                    {services.length === 0 && <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No services found.</div>}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {serviceDetails ? (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>{serviceDetails.name}</h1>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{serviceDetails.description}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete('service', serviceDetails.id)}><HiOutlineTrash /> Delete Service</button>
                                <button className="btn btn-primary btn-sm" onClick={() => openModal('step', serviceDetails.id)}>
                                    <HiOutlinePlus /> Add Step
                                </button>
                            </div>
                        </div>

                        {/* Steps Loop */}
                        {serviceDetails.steps?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {serviceDetails.steps.map((step, idx) => (
                                    <div key={step.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Step {toRoman(idx)} {step.name ? `- ${step.name}` : ''}</h3>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-icon" onClick={() => openModal('step', serviceDetails.id, step)} title="Edit Step"><HiOutlinePlus style={{transform: 'rotate(45deg)'}}/></button>
                                                <button className="btn-icon" onClick={() => openModal('task', step.id)} title="Add Task"><HiOutlinePlus /></button>
                                                <button className="btn-icon" onClick={() => handleDelete('step', step.id)} title="Delete Step" style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
                                            </div>
                                        </div>
                                        
                                        {/* Tasks Loop */}
                                        {step.tasks?.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {step.tasks.map(task => (
                                                    <div key={task.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{task.name}</div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Duration: {task.default_duration_days || '-'} days</div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button className="btn-icon" onClick={() => openModal('task', step.id, task)} title="Edit Task" style={{ color: 'var(--text-secondary)' }}><HiOutlinePlus style={{transform: 'rotate(45deg)'}}/></button>
                                                                <button className="btn-icon" onClick={() => openModal('doc', task.id)} title="Attach Reference Document" style={{ color: 'var(--primary)' }}><HiOutlineDocumentAdd /></button>
                                                                <button className="btn-icon" onClick={() => handleDelete('task', task.id)} title="Delete Task" style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>
                                                            </div>
                                                        </div>

                                                        {/* Reference Documents Loop */}
                                                        {task.documents?.length > 0 && (
                                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Reference Documents</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                    {task.documents.map(doc => (
                                                                        <div key={doc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                                                                            <HiOutlinePaperClip /> {doc.name}
                                                                            <HiOutlineX style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => handleDelete('doc', doc.id, task.id)} />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tasks added to this step yet.</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="icon"><HiOutlineCollection /></div>
                                <h3>No Steps Yet</h3>
                                <p>Add a phase/step to begin building out this service's workflow.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Select a service to view details
                    </div>
                )}
            </div>

            {/* Universal Modal */}
            {modalConfig && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {modalConfig.type === 'service' && (modalConfig.editData ? "Edit Service" : "Create Service")}
                                {modalConfig.type === 'step' && (modalConfig.editData ? "Edit Step" : "Add Step")}
                                {modalConfig.type === 'task' && (modalConfig.editData ? "Edit Task" : "Add Task")}
                                {modalConfig.type === 'doc' && "Attach Document"}
                                {modalConfig.type === 'doc_create' && "Upload New Document"}
                            </h2>
                            <button className="btn-icon" onClick={closeModal}><HiOutlineX /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                {modalConfig.type === 'service' && (
                                    <>
                                        <div className="form-group"><label>Service Name *</label><input required className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Opex" /></div>
                                        <div className="form-group"><label>Service Code *</label><input required className="form-control" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g. OPx" /></div>
                                        <div className="form-group"><label>Description</label><input className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                                    </>
                                )}
                                {modalConfig.type === 'step' && (
                                    <>
                                        <div className="form-group"><label>Step Name (Optional)</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Pre-Audit (Optional)" /></div>
                                        <div className="form-group"><label>Description</label><input className="form-control" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
                                    </>
                                )}
                                {modalConfig.type === 'task' && (
                                    <>
                                        <div className="form-group"><label>Task Name *</label><input required className="form-control" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Data Collection" /></div>
                                        <div className="form-group"><label>Description</label><input className="form-control" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
                                        <div className="form-group"><label>Standard Duration (Days)</label><input type="number" className="form-control" value={form.default_duration_days || ''} onChange={e => setForm({...form, default_duration_days: parseInt(e.target.value)})} /></div>
                                    </>
                                )}
                                {modalConfig.type === 'doc' && (
                                    <>
                                        <div className="form-group">
                                            <label>Select Existing Reference Document *</label>
                                            <select required className="form-control" value={form.document_id} onChange={e => setForm({...form, document_id: e.target.value})}>
                                                <option value="">Select Document...</option>
                                                {docs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Don't see it here? </span>
                                            <span style={{ color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }} onClick={() => openModal('doc_create')}>Upload a new one</span>
                                        </div>
                                    </>
                                )}
                                {modalConfig.type === 'doc_create' && (
                                    <>
                                        <div className="form-group"><label>Document Title *</label><input required className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. ISO 9001 Guidelines" /></div>
                                        <div className="form-group"><label>File Path / URL *</label><input required type="url" className="form-control" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} placeholder="https://..." /></div>
                                        <div className="form-group"><label>Description</label><input className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
