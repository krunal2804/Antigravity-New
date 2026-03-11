/**
 * Migration: Create roles table
 * Stores all roles for both consulting company and client side.
 */
exports.up = function (knex) {
    return knex.schema.createTable('roles', (table) => {
        table.increments('id').primary();
        table.string('name', 100).notNullable().unique();
        table.enum('side', ['consulting', 'client']).notNullable();
        table.integer('hierarchy_level').notNullable();
        table.text('description').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true); // created_at, updated_at
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('roles');
};
