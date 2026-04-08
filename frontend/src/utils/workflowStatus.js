export function getWorkflowStatusBadge(status) {
    if (status === 'completed') return 'badge-success';
    if (status === 'active' || status === 'in_progress') return 'badge-warning';
    return 'badge-default';
}

export function formatWorkflowStatus(status) {
    if (status === 'completed') return 'Completed';
    if (status === 'active' || status === 'in_progress') return 'Active';
    return 'Not Started';
}
