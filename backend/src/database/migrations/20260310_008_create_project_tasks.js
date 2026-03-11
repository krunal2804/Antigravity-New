/**
 * Migration: Create project_tasks table
 * Actual tasks for a specific project — instantiated from service_tasks templates.
 */
exports.up = function (knex) {
    return knex.schema.createTable('project_tasks', (table) => {
        table.increments('id').primary();
        table
            .integer('project_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table
            .integer('service_task_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('service_tasks')
            .onDelete('SET NULL');
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table
            .integer('assigned_to')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.integer('sequence_order').notNullable();
        table.date('start_date').nullable();
        table.date('due_date').nullable();
        table.date('actual_start_date').nullable();
        table.date('actual_end_date').nullable();
        table
            .enum('status', [
                'not_started',
                'in_progress',
                'completed',
                'overdue',
                'skipped',
            ])
            .defaultTo('not_started');
        table.boolean('is_mandatory').defaultTo(true);
        table.text('remarks').nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('project_tasks');
};
