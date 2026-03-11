/**
 * Migration: Create audit_logs table
 * System-wide activity log for compliance and traceability.
 */
exports.up = function (knex) {
    return knex.schema.createTable('audit_logs', (table) => {
        table.bigIncrements('id').primary();
        table
            .integer('user_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.string('action', 100).notNullable();
        table.string('entity_type', 100).notNullable();
        table.integer('entity_id').nullable();
        table.jsonb('old_values').nullable();
        table.jsonb('new_values').nullable();
        table.string('ip_address', 45).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};
