exports.up = function(knex) {
    return knex.schema.alterTable('reference_documents', (table) => {
        table.integer('service_id').unsigned().references('id').inTable('services').onDelete('CASCADE');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('reference_documents', (table) => {
        table.dropColumn('service_id');
    });
};
