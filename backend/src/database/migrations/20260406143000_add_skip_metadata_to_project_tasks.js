exports.up = async function (knex) {
    await knex.schema.alterTable('project_tasks', (table) => {
        table.integer('skipped_by_user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
        table.string('skipped_by_name', 255).nullable();
        table.text('skip_reason').nullable();
        table.timestamp('skipped_at').nullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('project_tasks', (table) => {
        table.dropColumn('skipped_at');
        table.dropColumn('skip_reason');
        table.dropColumn('skipped_by_name');
        table.dropColumn('skipped_by_user_id');
    });
};
