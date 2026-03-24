exports.up = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        // Faber Point of Contact
        table.integer('faber_poc_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
        
        // Top Management Details
        table.string('top_management_name').nullable();
        table.string('top_management_designation').nullable();
        table.string('top_management_mobile').nullable();
        table.string('top_management_email').nullable();

        // Client Point of Contact Details
        table.string('client_poc_name').nullable();
        table.string('client_poc_designation').nullable();
        table.string('client_poc_mobile').nullable();
        table.string('client_poc_email').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.dropForeign('faber_poc_id');
        table.dropColumn('faber_poc_id');
        
        table.dropColumn('top_management_name');
        table.dropColumn('top_management_designation');
        table.dropColumn('top_management_mobile');
        table.dropColumn('top_management_email');

        table.dropColumn('client_poc_name');
        table.dropColumn('client_poc_designation');
        table.dropColumn('client_poc_mobile');
        table.dropColumn('client_poc_email');
    });
};
