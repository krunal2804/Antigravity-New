/**
 * Migration: Create project_timeline_events table
 * Milestone tracker and audit trail per project.
 */
exports.up = function (knex) {
    return knex.schema.createTable('project_timeline_events', (table) => {
        table.increments('id').primary();
        table
            .integer('project_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('projects')
            .onDelete('CASCADE');
        table
            .enum('event_type', [
                'milestone',
                'status_change',
                'note',
                'escalation',
                'review',
            ])
            .notNullable();
        table.string('title', 255).notNullable();
        table.text('description').nullable();
        table.timestamp('event_date').defaultTo(knex.fn.now());
        table
            .integer('created_by')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('project_timeline_events');
};
