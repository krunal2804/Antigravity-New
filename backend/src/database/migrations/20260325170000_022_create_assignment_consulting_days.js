/**
 * Migration 022 – Consulting Days tables + schedule_type on assignments
 */
exports.up = async function (knex) {
    // Add schedule_type column to assignments
    await knex.schema.alterTable('assignments', (table) => {
        table.string('schedule_type').defaultTo('month'); // 'month' or 'workshop'
    });

    // Team members assigned to an assignment
    await knex.schema.createTable('assignment_team_members', (table) => {
        table.increments('id').primary();
        table.integer('assignment_id').unsigned().notNullable()
            .references('id').inTable('assignments').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.string('title'); // e.g. "Industrial Engineer/Ass. Consultant"
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Days grid: one row per team-member per period
    await knex.schema.createTable('assignment_consulting_days', (table) => {
        table.increments('id').primary();
        table.integer('assignment_id').unsigned().notNullable()
            .references('id').inTable('assignments').onDelete('CASCADE');
        table.integer('team_member_id').unsigned().notNullable()
            .references('id').inTable('assignment_team_members').onDelete('CASCADE');
        table.string('period_label').notNullable(); // "Month 1", "Workshop 2"
        table.integer('period_index').notNullable(); // ordering
        table.integer('days').defaultTo(0);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('assignment_consulting_days');
    await knex.schema.dropTableIfExists('assignment_team_members');
    await knex.schema.alterTable('assignments', (table) => {
        table.dropColumn('schedule_type');
    });
};
