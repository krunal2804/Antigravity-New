function normalizeProgressValue(value) {
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric < 0) return 0;
    if (numeric > 100) return 100;
    return numeric;
}

function calculateAssignmentProgress(projects = []) {
    if (!Array.isArray(projects) || projects.length === 0) {
        return 0;
    }

    const totalProgress = projects.reduce((sum, project) => {
        return sum + normalizeProgressValue(project.progress_percentage);
    }, 0);

    return Number((totalProgress / projects.length).toFixed(1));
}

module.exports = {
    calculateAssignmentProgress,
};
