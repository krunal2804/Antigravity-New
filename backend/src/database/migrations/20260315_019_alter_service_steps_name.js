/**
 * Migration: Make service_steps.name optional/nullable
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('service_steps', (table) => {
        table.string('name', 255).nullable().alter();
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('service_steps', (table) => {
        table.string('name', 255).notNullable().alter();
    });
};
