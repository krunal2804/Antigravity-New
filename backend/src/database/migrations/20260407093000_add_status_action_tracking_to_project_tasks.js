exports.up = async function (knex) {
    await knex.schema.alterTable('project_tasks', (table) => {
        table.integer('status_updated_by_user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
        table.string('status_updated_by_name', 255).nullable();
        table.timestamp('status_updated_at').nullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('project_tasks', (table) => {
        table.dropColumn('status_updated_at');
        table.dropColumn('status_updated_by_name');
        table.dropColumn('status_updated_by_user_id');
    });
};
