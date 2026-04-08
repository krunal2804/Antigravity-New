/**
 * Migration: Drop end_date column from assignments and projects tables.
 */
exports.up = function (knex) {
    return knex.schema
        .alterTable('assignments', (table) => {
            table.dropColumn('end_date');
        })
        .alterTable('projects', (table) => {
            table.dropColumn('end_date');
        });
};

exports.down = function (knex) {
    return knex.schema
        .alterTable('assignments', (table) => {
            table.date('end_date').nullable();
        })
        .alterTable('projects', (table) => {
            table.date('end_date').nullable();
        });
};
