exports.up = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.string('logistics_poc_name');
        table.string('logistics_poc_designation');
        table.string('logistics_poc_mobile');
        table.string('logistics_poc_email');
        table.jsonb('logistics_arrangements').defaultTo('{}');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('assignments', (table) => {
        table.dropColumn('logistics_poc_name');
        table.dropColumn('logistics_poc_designation');
        table.dropColumn('logistics_poc_mobile');
        table.dropColumn('logistics_poc_email');
        table.dropColumn('logistics_arrangements');
    });
};
