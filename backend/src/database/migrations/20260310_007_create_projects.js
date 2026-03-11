/**
 * Migration: Create projects table
 * Individual projects under an assignment, linked to a specific service type.
 */
exports.up = function (knex) {
    return knex.schema.createTable('projects', (table) => {
        table.increments('id').primary();
        table
            .integer('assignment_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('assignments')
            .onDelete('CASCADE');
        table
            .integer('service_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('services')
            .onDelete('RESTRICT');
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table.string('project_code', 50).unique().nullable();
        table.date('start_date').nullable();
        table.date('end_date').nullable();
        table.date('actual_end_date').nullable();
        table
            .enum('status', [
                'not_started',
                'in_progress',
                'on_hold',
                'completed',
                'cancelled',
            ])
            .defaultTo('not_started');
        table.decimal('progress_percentage', 5, 2).defaultTo(0.0);
        table.boolean('is_active').defaultTo(true);
        table
            .integer('created_by')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('projects');
};
