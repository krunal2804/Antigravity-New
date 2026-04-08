exports.up = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.text('special_instructions');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.dropColumn('special_instructions');
    });
};
