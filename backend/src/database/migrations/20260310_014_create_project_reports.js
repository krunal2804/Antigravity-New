/**
 * Migration: Create project_reports table
 * Periodic or on-demand project health reports.
 */
exports.up = function (knex) {
    return knex.schema.createTable('project_reports', (table) => {
        table.increments('id').primary();
        table
            .integer('project_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table
            .enum('report_type', ['weekly', 'monthly', 'milestone', 'final'])
            .notNullable();
        table.string('title', 255).notNullable();
        table.text('summary').nullable();
        table.enum('health_status', ['green', 'yellow', 'red']).notNullable();
        table.integer('tasks_completed').defaultTo(0);
        table.integer('tasks_total').defaultTo(0);
        table.integer('tasks_overdue').defaultTo(0);
        table
            .integer('generated_by')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.date('report_date').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('project_reports');
};
