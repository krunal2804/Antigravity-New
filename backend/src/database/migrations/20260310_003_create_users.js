/**
 * Migration: Create users table
 * All platform users — consulting employees and client personnel.
 */
exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('first_name', 100).notNullable();
        table.string('last_name', 100).notNullable();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.string('phone', 20).nullable();
        table
            .integer('role_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('roles')
            .onDelete('RESTRICT');
        table
            .integer('organization_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('organizations')
            .onDelete('SET NULL');
        table.boolean('is_active').defaultTo(true);
        table.string('avatar_url', 500).nullable();
        table.timestamp('last_login_at').nullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
