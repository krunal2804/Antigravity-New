import { useState, useEffect } from 'react';
import api from '../api';
import { HiOutlineClipboardCheck, HiOutlineCheckCircle } from 'react-icons/hi';

export default function MyTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [skipModalTask, setSkipModalTask] = useState(null);
    const [skipReason, setSkipReason] = useState('This task is Out of scope for this Project');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        api.get('/tasks/my')
            .then((res) => setTasks(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleStatusChange = async (taskId, newStatus, extraPayload = {}) => {
        setUpdating(taskId);
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus, ...extraPayload });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update task:', err);
            window.alert(err.response?.data?.error || 'Failed to update task status.');
            fetchTasks();
        } finally {
            setUpdating(null);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            not_started: 'badge-default',
            in_progress: 'badge-info',
            completed: 'badge-success',
            skipped: 'badge-warning',
        };
        return map[status] || 'badge-default';
    };

    const getTaskActionText = (task) => {
        if (!task.status_updated_by_name || !task.status_updated_at) return null;

        const actionByStatus = {
            completed: 'Completed',
            skipped: 'Skipped',
            in_progress: 'Started',
            not_started: 'Marked not started',
        };

        const actionLabel = actionByStatus[task.status] || 'Updated';
        const actionDate = new Date(task.status_updated_at).toLocaleDateString();
        return `${actionLabel} by ${task.status_updated_by_name} on ${actionDate}`;
    };

    const openSkipModal = (task) => {
        setSkipModalTask(task);
        setSkipReason(task.skip_reason || 'This task is Out of scope for this Project');
    };

    const closeSkipModal = () => {
        if (updating === skipModalTask?.id) return;
        setSkipModalTask(null);
        setSkipReason('This task is Out of scope for this Project');
    };

    const submitSkipReason = async () => {
        if (!skipModalTask) return;

        await handleStatusChange(skipModalTask.id, 'skipped', { skip_reason: skipReason });
        setSkipModalTask(null);
        setSkipReason('This task is Out of scope for this Project');
    };

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    const pendingTasks = tasks.filter((task) => task.status !== 'completed');
    const completedTasks = tasks.filter((task) => task.status === 'completed');
    const lockedTaskIds = new Set(tasks.filter((task) => task.is_locked).map((task) => task.id));

    return (
        <div className="fade-in">
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

            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <span className="card-title">Pending Tasks ({pendingTasks.length})</span>
                </div>
                {pendingTasks.length > 0 ? (
                    <div className="task-list">
                        {pendingTasks.map((task) => {
                            const isLocked = lockedTaskIds.has(task.id);
                            const taskActionText = getTaskActionText(task);

                            return (
                                <div className="task-item" key={task.id} style={{ opacity: isLocked ? 0.6 : 1 }}>
                                    <div className="task-order">{task.sequence_order}</div>
                                    <div className="task-info">
                                        <h4>{task.name}</h4>
                                        <p>{task.project_name} • {task.organization_name}</p>
                                        {taskActionText && (
                                            <div className="task-action-meta">{taskActionText}</div>
                                        )}
                                        {isLocked && (
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                                                Locked until earlier tasks in this project are completed.
                                            </div>
                                        )}
                                    </div>
                                    <span className={`badge ${getStatusBadge(task.status)}`}>
                                        {task.status.replace(/_/g, ' ')}
                                    </span>
                                    <select
                                        className="task-status-select"
                                        value={task.status}
                                        onChange={(e) => {
                                            const nextStatus = e.target.value;
                                            if (nextStatus === 'skipped') {
                                                openSkipModal(task);
                                                return;
                                            }
                                            handleStatusChange(task.id, nextStatus);
                                        }}
                                        disabled={updating === task.id || isLocked}
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="skipped">Skipped</option>
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="icon"><HiOutlineCheckCircle /></div>
                        <h3>All tasks completed!</h3>
                        <p>Great work - you've finished all your assigned tasks.</p>
                    </div>
                )}
            </div>

            {completedTasks.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Completed Tasks ({completedTasks.length})</span>
                    </div>
                    <div className="task-list">
                        {completedTasks.map((task) => {
                            const taskActionText = getTaskActionText(task);

                            return (
                                <div className="task-item" key={task.id} style={{ opacity: 0.6 }}>
                                    <div className="task-order" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>?</div>
                                    <div className="task-info">
                                        <h4 style={{ textDecoration: 'line-through' }}>{task.name}</h4>
                                        <p>{task.project_name} • {task.organization_name}</p>
                                        {taskActionText && (
                                            <div className="task-action-meta">{taskActionText}</div>
                                        )}
                                    </div>
                                    <span className="badge badge-success">completed</span>
                                </div>
                            );
                        })}
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

            {skipModalTask && (
                <div className="modal-overlay" onClick={closeSkipModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Skip Task</h2>
                        </div>
                        <div className="modal-body">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="my-task-skip-reason">Reason</label>
                                <input
                                    id="my-task-skip-reason"
                                    className="form-control"
                                    value={skipReason}
                                    onChange={(e) => setSkipReason(e.target.value)}
                                    placeholder="Enter skip reason"
                                    disabled={updating === skipModalTask.id}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeSkipModal} disabled={updating === skipModalTask.id}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={submitSkipReason}
                                disabled={updating === skipModalTask.id || !skipReason.trim()}
                            >
                                {updating === skipModalTask.id ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
