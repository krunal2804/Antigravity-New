/**
 * Migration: Create project_members table
 * Maps users (consulting + client) to projects with their role.
 */
exports.up = function (knex) {
    return knex.schema.createTable('project_members', (table) => {
        table.increments('id').primary();
        table
            .integer('project_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table
            .integer('user_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table
            .integer('role_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('roles')
            .onDelete('RESTRICT');
        table.boolean('is_primary').defaultTo(false);
        table.timestamp('joined_at').defaultTo(knex.fn.now());
        table.timestamp('left_at').nullable();
        table.timestamps(true, true);

        // A user can only be assigned once per project
        table.unique(['project_id', 'user_id']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('project_members');
};
