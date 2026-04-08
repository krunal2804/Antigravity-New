const DONE_TASK_STATUSES = ['completed', 'skipped'];

function normalizeCount(value) {
    const numeric = Number.parseInt(value, 10);
    return Number.isFinite(numeric) ? numeric : 0;
}

function deriveProjectDbStatus(taskTotal, doneTaskCount) {
    const total = normalizeCount(taskTotal);
    const done = normalizeCount(doneTaskCount);

    if (total === 0 || done === 0) return 'not_started';
    if (done >= total) return 'completed';
    return 'in_progress';
}

function deriveProjectWorkflowStatus(taskTotal, doneTaskCount) {
    const dbStatus = deriveProjectDbStatus(taskTotal, doneTaskCount);
    if (dbStatus === 'in_progress') return 'active';
    return dbStatus;
}

function deriveProjectWorkflowStatusFromTasks(tasks = []) {
    const total = Array.isArray(tasks) ? tasks.length : 0;
    const done = Array.isArray(tasks)
        ? tasks.filter((task) => DONE_TASK_STATUSES.includes(task.status)).length
        : 0;

    return deriveProjectWorkflowStatus(total, done);
}

function deriveAssignmentWorkflowStatus(projectStatuses = []) {
    if (!Array.isArray(projectStatuses) || projectStatuses.length === 0) {
        return 'not_started';
    }

    if (projectStatuses.every((status) => status === 'completed')) {
        return 'completed';
    }

    if (projectStatuses.every((status) => status === 'not_started')) {
        return 'not_started';
    }

    return 'active';
}

module.exports = {
    DONE_TASK_STATUSES,
    deriveProjectDbStatus,
    deriveProjectWorkflowStatus,
    deriveProjectWorkflowStatusFromTasks,
    deriveAssignmentWorkflowStatus,
};
