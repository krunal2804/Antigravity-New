/**
 * Migration: Create notifications table
 * System notifications for users.
 */
exports.up = function (knex) {
    return knex.schema.createTable('notifications', (table) => {
        table.increments('id').primary();
        table
            .integer('user_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.string('title', 255).notNullable();
        table.text('message').notNullable();
        table
            .enum('type', [
                'task_assigned',
                'task_overdue',
                'status_change',
                'comment',
                'general',
            ])
            .notNullable();
        table.string('reference_type', 50).nullable();
        table.integer('reference_id').nullable();
        table.boolean('is_read').defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('notifications');
};
