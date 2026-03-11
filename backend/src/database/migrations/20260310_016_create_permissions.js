/**
 * Migration: Create permissions table
 * Role-based access control per module.
 */
exports.up = function (knex) {
    return knex.schema.createTable('permissions', (table) => {
        table.increments('id').primary();
        table
            .integer('role_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('roles')
            .onDelete('CASCADE');
        table.string('module', 100).notNullable();
        table.boolean('can_view').defaultTo(false);
        table.boolean('can_create').defaultTo(false);
        table.boolean('can_edit').defaultTo(false);
        table.boolean('can_delete').defaultTo(false);
        table.timestamps(true, true);

        // One permission entry per role per module
        table.unique(['role_id', 'module']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('permissions');
};
