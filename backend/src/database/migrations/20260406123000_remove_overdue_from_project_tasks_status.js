exports.up = async function (knex) {
    try {
        await knex.transaction(async (trx) => {
            await trx('project_tasks')
                .where({ status: 'overdue' })
                .update({
                    status: 'not_started',
                    updated_at: trx.fn.now(),
                });

            await trx.raw(`
                ALTER TABLE project_tasks
                DROP CONSTRAINT IF EXISTS project_tasks_status_check
            `);

            await trx.raw(`
                ALTER TABLE project_tasks
                ADD CONSTRAINT project_tasks_status_check
                CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped'))
            `);
        });
    } catch (error) {
        console.error('Migration failed: remove overdue from project_tasks status', error);
        throw error;
    }
};

exports.down = async function (knex) {
    try {
        await knex.transaction(async (trx) => {
            await trx.raw(`
                ALTER TABLE project_tasks
                DROP CONSTRAINT IF EXISTS project_tasks_status_check
            `);

            await trx.raw(`
                ALTER TABLE project_tasks
                ADD CONSTRAINT project_tasks_status_check
                CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue', 'skipped'))
            `);
        });
    } catch (error) {
        console.error('Rollback failed: restore overdue in project_tasks status', error);
        throw error;
    }
};
