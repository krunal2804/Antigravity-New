/**
 * Migration: Create task_comments table
 * Comments / discussion on individual project tasks.
 */
exports.up = function (knex) {
    return knex.schema.createTable('task_comments', (table) => {
        table.increments('id').primary();
        table
            .integer('project_task_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('project_tasks')
            .onDelete('CASCADE');
        table
            .integer('user_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.text('comment').notNullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('task_comments');
};
