import { useState, useEffect } from 'react';
import api from '../api';
import { HiOutlineClipboardCheck, HiOutlineCheckCircle } from 'react-icons/hi';

export default function MyTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        api.get('/tasks/my')
            .then((res) => setTasks(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setUpdating(taskId);
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            setTasks(tasks.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            ));
        } catch (err) {
            console.error('Failed to update task:', err);
        } finally {
            setUpdating(null);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            not_started: 'badge-default',
            in_progress: 'badge-info',
            completed: 'badge-success',
            overdue: 'badge-danger',
            skipped: 'badge-warning',
        };
        return map[status] || 'badge-default';
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return (
        <div className="fade-in">
            {/* Summary stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon blue"><HiOutlineClipboardCheck /></div>
                    <div className="stat-info">
                        <h3>{tasks.length}</h3>
                        <p>Total Tasks</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><HiOutlineCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{completedTasks.length}</h3>
                        <p>Completed</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><HiOutlineClipboardCheck /></div>
                    <div className="stat-info">
                        <h3>{pendingTasks.length}</h3>
                        <p>Pending</p>
                    </div>
                </div>
            </div>

            {/* Pending Tasks */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <span className="card-title">Pending Tasks ({pendingTasks.length})</span>
                </div>
                {pendingTasks.length > 0 ? (
                    <div className="task-list">
                        {pendingTasks.map((task) => (
                            <div className="task-item" key={task.id}>
                                <div className="task-order">{task.sequence_order}</div>
                                <div className="task-info">
                                    <h4>{task.name}</h4>
                                    <p>{task.project_name} • {task.organization_name}</p>
                                </div>
                                <span className={`badge ${getStatusBadge(task.status)}`}>
                                    {task.status.replace(/_/g, ' ')}
                                </span>
                                <select
                                    className="task-status-select"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                    disabled={updating === task.id}
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="icon"><HiOutlineCheckCircle /></div>
                        <h3>All tasks completed!</h3>
                        <p>Great work — you've finished all your assigned tasks.</p>
                    </div>
                )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Completed Tasks ({completedTasks.length})</span>
                    </div>
                    <div className="task-list">
                        {completedTasks.map((task) => (
                            <div className="task-item" key={task.id} style={{ opacity: 0.6 }}>
                                <div className="task-order" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>✓</div>
                                <div className="task-info">
                                    <h4 style={{ textDecoration: 'line-through' }}>{task.name}</h4>
                                    <p>{task.project_name} • {task.organization_name}</p>
                                </div>
                                <span className="badge badge-success">completed</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tasks.length === 0 && (
                <div className="empty-state">
                    <div className="icon"><HiOutlineClipboardCheck /></div>
                    <h3>No tasks assigned yet</h3>
                    <p>Tasks will appear here once your manager assigns work to you.</p>
                </div>
            )}
        </div>
    );
}
