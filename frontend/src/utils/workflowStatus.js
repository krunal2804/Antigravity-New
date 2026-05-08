export function getWorkflowStatusBadge(status) {
    if (status === 'completed') return 'badge-success';
    if (status === 'active' || status === 'in_progress') return 'badge-warning';
    return 'badge-default';
}

export function formatWorkflowStatus(status) {
    if (status === 'completed') return 'Completed';
    if (status === 'skipped') return 'Skipped';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'active') return 'Active';
    return 'Not Started';
}
