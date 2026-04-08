exports.up = async function (knex) {
    const hasStatusColumn = await knex.schema.hasColumn('project_tasks', 'status');
    if (!hasStatusColumn) return;

    await knex('project_tasks')
        .where({ status: 'overdue' })
        .update({
            status: 'not_started',
            updated_at: knex.fn.now(),
        });
};

exports.down = async function () {
    // Intentionally left as a no-op compatibility migration.
};
