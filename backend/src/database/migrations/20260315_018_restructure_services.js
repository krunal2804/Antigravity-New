/**
 * Migration: Restructure Services to Services -> Steps -> Tasks + Add Reference Documents
 */
exports.up = async function (knex) {
    // 1. Clear existing template data to avoid schema conflicts on constraints
    await knex.raw('TRUNCATE TABLE project_tasks CASCADE');
    await knex.raw('TRUNCATE TABLE service_tasks CASCADE');

    // 2. Drop the FK in project_tasks before renaming the target table
    await knex.schema.alterTable('project_tasks', (table) => {
        table.dropForeign('service_task_id');
    });

    // 3. Rename old service_tasks -> service_steps
    await knex.schema.renameTable('service_tasks', 'service_steps');

    // 4. Alter service_steps to remove task-specific fields
    await knex.schema.alterTable('service_steps', (table) => {
        table.dropColumn('default_duration_days');
        table.dropColumn('is_mandatory');
    });

    // 5. Create new service_tasks table (child of service_steps)
    await knex.schema.createTable('service_tasks', (table) => {
        table.increments('id').primary();
        table.integer('service_step_id').unsigned().notNullable().references('id').inTable('service_steps').onDelete('CASCADE');
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table.integer('default_duration_days').nullable();
        table.integer('sequence_order').notNullable().defaultTo(0);
        table.boolean('is_mandatory').defaultTo(true);
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });

    // 6. Restore FK in project_tasks pointing to NEW service_tasks and add step_name for grouping
    await knex.schema.alterTable('project_tasks', (table) => {
        table.foreign('service_task_id').references('id').inTable('service_tasks').onDelete('SET NULL');
        table.string('step_name', 255).nullable();
    });

    // 7. Create reference_documents table
    await knex.schema.createTable('reference_documents', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('file_url', 1000).notNullable();
        table.text('description').nullable();
        table.timestamps(true, true);
    });

    // 8. Create mapping table for Task <-> Documents
    await knex.schema.createTable('service_task_documents', (table) => {
        table.increments('id').primary();
        table.integer('service_task_id').unsigned().notNullable().references('id').inTable('service_tasks').onDelete('CASCADE');
        table.integer('document_id').unsigned().notNullable().references('id').inTable('reference_documents').onDelete('CASCADE');
        table.unique(['service_task_id', 'document_id']);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('service_task_documents');
    await knex.schema.dropTableIfExists('reference_documents');
    
    await knex.schema.alterTable('project_tasks', (table) => {
        table.dropColumn('step_name');
        table.dropForeign('service_task_id');
    });

    await knex.schema.dropTableIfExists('service_tasks');

    await knex.schema.alterTable('service_steps', (table) => {
        table.integer('default_duration_days').nullable();
        table.boolean('is_mandatory').defaultTo(true);
    });
    await knex.schema.renameTable('service_steps', 'service_tasks');

    await knex.schema.alterTable('project_tasks', (table) => {
        table.foreign('service_task_id').references('id').inTable('service_tasks').onDelete('SET NULL');
    });
};
