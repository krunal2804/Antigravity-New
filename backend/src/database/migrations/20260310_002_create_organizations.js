/**
 * Migration: Create organizations table
 * Stores client companies that the consulting firm works with.
 */
exports.up = function (knex) {
    return knex.schema.createTable('organizations', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('industry', 100).nullable();
        table.string('website', 500).nullable();
        table.text('address').nullable();
        table.string('city', 100).nullable();
        table.string('state', 100).nullable();
        table.string('country', 100).nullable();
        table.string('pincode', 20).nullable();
        table.string('phone', 20).nullable();
        table.string('email', 255).nullable();
        table.string('logo_url', 500).nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('organizations');
};
