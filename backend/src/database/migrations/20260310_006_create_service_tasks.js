/**
 * Migration: Create service_tasks table
 * Template tasks for each service type — copied into project_tasks when a project is created.
 */
exports.up = function (knex) {
    return knex.schema.createTable('service_tasks', (table) => {
        table.increments('id').primary();
        table
            .integer('service_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('services')
            .onDelete('CASCADE');
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table.integer('default_duration_days').nullable();
        table.integer('sequence_order').notNullable();
        table.boolean('is_mandatory').defaultTo(true);
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('service_tasks');
};
