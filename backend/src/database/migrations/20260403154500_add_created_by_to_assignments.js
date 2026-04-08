exports.up = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        // ID of the user (Manager/Director) who created this assignment
        table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.dropForeign('created_by');
        table.dropColumn('created_by');
    });
};
