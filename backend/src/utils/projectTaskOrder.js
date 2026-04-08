const ACTIVE_TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'skipped'];

function isTaskComplete(task) {
    return task.status === 'completed' || task.status === 'skipped';
}

function getNumericSortValue(value) {
    return Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER;
}

function normalizeTaskOrder(tasks) {
    return [...tasks].sort((a, b) => {
        const leftStepSequence = getNumericSortValue(a.service_step_sequence_order);
        const rightStepSequence = getNumericSortValue(b.service_step_sequence_order);
        if (leftStepSequence !== rightStepSequence) return leftStepSequence - rightStepSequence;

        const leftTaskSequence = getNumericSortValue(a.service_task_sequence_order);
        const rightTaskSequence = getNumericSortValue(b.service_task_sequence_order);
        if (leftTaskSequence !== rightTaskSequence) return leftTaskSequence - rightTaskSequence;

        const leftSequence = getNumericSortValue(a.sequence_order);
        const rightSequence = getNumericSortValue(b.sequence_order);
        if (leftSequence !== rightSequence) return leftSequence - rightSequence;

        return a.id - b.id;
    });
}

function buildTaskLockState(tasks) {
    const orderedTasks = normalizeTaskOrder(tasks);
    let hasIncompletePriorTask = false;

    return orderedTasks.map((task, index) => {
        const isLocked = hasIncompletePriorTask;
        if (!isTaskComplete(task)) {
            hasIncompletePriorTask = true;
        }

        return {
            ...task,
            sequence_order: index + 1,
            is_locked: isLocked,
        };
    });
}

function getBlockingTask(tasks, targetTaskId) {
    const orderedTasks = normalizeTaskOrder(tasks);
    let blockingTask = null;

    for (const task of orderedTasks) {
        if (task.id === Number(targetTaskId)) {
            return blockingTask;
        }

        if (!isTaskComplete(task)) {
            blockingTask = task;
        }
    }

    return null;
}

async function fetchProjectTasksForOrder(dbOrTrx, projectId) {
    return dbOrTrx('project_tasks')
        .leftJoin('service_tasks', 'project_tasks.service_task_id', 'service_tasks.id')
        .leftJoin('service_steps', 'service_tasks.service_step_id', 'service_steps.id')
        .where({ project_id: projectId })
        .select(
            'project_tasks.id',
            'project_tasks.project_id',
            'project_tasks.status',
            'project_tasks.sequence_order',
            'service_tasks.sequence_order as service_task_sequence_order',
            'service_steps.sequence_order as service_step_sequence_order'
        )
        .orderBy('service_steps.sequence_order')
        .orderBy('service_tasks.sequence_order')
        .orderBy('project_tasks.sequence_order')
        .orderBy('project_tasks.id');
}

async function resequenceProjectTasks(dbOrTrx, projectId) {
    const tasks = await dbOrTrx('project_tasks')
        .leftJoin('service_tasks', 'project_tasks.service_task_id', 'service_tasks.id')
        .leftJoin('service_steps', 'service_tasks.service_step_id', 'service_steps.id')
        .where('project_tasks.project_id', projectId)
        .select(
            'project_tasks.id',
            'project_tasks.sequence_order as project_sequence_order',
            'project_tasks.created_at',
            'service_tasks.sequence_order as service_task_sequence_order',
            'service_steps.sequence_order as service_step_sequence_order'
        );

    const orderedTasks = [...tasks].sort((a, b) => {
        const leftStep = getNumericSortValue(a.service_step_sequence_order);
        const rightStep = getNumericSortValue(b.service_step_sequence_order);
        if (leftStep !== rightStep) return leftStep - rightStep;

        const leftTask = getNumericSortValue(a.service_task_sequence_order);
        const rightTask = getNumericSortValue(b.service_task_sequence_order);
        if (leftTask !== rightTask) return leftTask - rightTask;

        const leftProject = getNumericSortValue(a.project_sequence_order);
        const rightProject = getNumericSortValue(b.project_sequence_order);
        if (leftProject !== rightProject) return leftProject - rightProject;

        const leftCreatedAt = a.created_at ? new Date(a.created_at).getTime() : 0;
        const rightCreatedAt = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt - rightCreatedAt;

        return a.id - b.id;
    });

    await Promise.all(
        orderedTasks.map((task, index) =>
            dbOrTrx('project_tasks')
                .where({ id: task.id })
                .update({ sequence_order: index + 1, updated_at: dbOrTrx.fn.now() })
        )
    );
}

async function resequenceProjectsForService(dbOrTrx, serviceId) {
    const projects = await dbOrTrx('projects')
        .where({ service_id: serviceId, is_active: true })
        .select('id');

    for (const project of projects) {
        await resequenceProjectTasks(dbOrTrx, project.id);
    }
}

module.exports = {
    ACTIVE_TASK_STATUSES,
    buildTaskLockState,
    fetchProjectTasksForOrder,
    getBlockingTask,
    resequenceProjectTasks,
    resequenceProjectsForService,
};
