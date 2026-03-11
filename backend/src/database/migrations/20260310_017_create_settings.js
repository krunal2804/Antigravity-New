/**
 * Migration: Create settings table
 * Application-level key-value configuration store.
 */
exports.up = function (knex) {
    return knex.schema.createTable('settings', (table) => {
        table.increments('id').primary();
        table.string('key', 255).notNullable().unique();
        table.text('value').nullable();
        table.string('description', 500).nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('settings');
};
