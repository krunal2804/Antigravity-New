exports.up = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.boolean('conf_data_sharing').defaultTo(false);
        table.boolean('conf_aae_communication').defaultTo(false);
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.dropColumn('conf_data_sharing');
        table.dropColumn('conf_aae_communication');
    });
};
