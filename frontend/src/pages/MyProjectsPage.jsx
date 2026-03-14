import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineClipboardList, HiOutlineEye } from 'react-icons/hi';

export default function MyProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/projects')
            .then((res) => setProjects(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

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

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <div className="table-container">
                <div className="table-header">
                    <h2>My Assigned Projects ({projects.length})</h2>
                </div>

                {projects.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Organization</th>
                                <th>Assignment</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                                    <td>{p.organization_name}</td>
                                    <td>{p.assignment_name}</td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(p.status)}`}>
                                            {p.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
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
                                    <td>
                                        <button
                                            className="btn-icon"
                                            title="View Details"
                                            onClick={() => navigate(`/projects/${p.id}`, { state: { from: '/my-projects' } })}
                                        >
                                            <HiOutlineEye />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="icon"><HiOutlineClipboardList /></div>
                        <h3>No projects assigned yet</h3>
                        <p>You will see projects here once you are assigned as a member.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
