/**
 * Migration: Create assignments table
 * Branches/divisions of a client company where consulting work is done.
 */
exports.up = function (knex) {
    return knex.schema.createTable('assignments', (table) => {
        table.increments('id').primary();
        table
            .integer('organization_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('organizations')
            .onDelete('CASCADE');
        table.string('name', 255).notNullable();
        table.string('location', 255).nullable();
        table.text('description').nullable();
        table.date('start_date').nullable();
        table.date('end_date').nullable();
        table
            .enum('status', ['active', 'on_hold', 'completed', 'cancelled'])
            .defaultTo('active');
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('assignments');
};
