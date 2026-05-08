exports.up = function (knex) {
    return knex.schema.createTable('password_reset_requests', function (table) {
        table.increments('id').primary();
        table.string('email', 255).notNullable();
        table.string('code_hash', 255).notNullable();
        table.timestamp('expires_at', { useTz: true }).notNullable();
        table.integer('attempt_count').notNullable().defaultTo(0);
        table.integer('max_attempts').notNullable().defaultTo(3);
        table.boolean('is_used').notNullable().defaultTo(false);
        table.boolean('is_verified').notNullable().defaultTo(false);
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.index(['email']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('password_reset_requests');
};

