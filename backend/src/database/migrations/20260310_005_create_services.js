/**
 * Migration: Create services table
 * Types of consulting services offered (Time & Motion, Opex, 5S, etc.).
 */
exports.up = function (knex) {
    return knex.schema.createTable('services', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable().unique();
        table.string('code', 50).notNullable().unique();
        table.text('description').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('services');
};
