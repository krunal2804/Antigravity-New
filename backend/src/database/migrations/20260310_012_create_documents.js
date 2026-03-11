/**
 * Migration: Create documents table
 * File attachments linked to projects or tasks.
 */
exports.up = function (knex) {
    return knex.schema.createTable('documents', (table) => {
        table.increments('id').primary();
        table
            .integer('project_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table
            .integer('project_task_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('project_tasks')
            .onDelete('SET NULL');
        table
            .integer('uploaded_by')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.string('file_name', 255).notNullable();
        table.string('file_path', 500).notNullable();
        table.string('file_type', 50).nullable();
        table.bigInteger('file_size').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('documents');
};
