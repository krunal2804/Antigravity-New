const bcrypt = require('bcryptjs');

exports.up = async function (knex) {
    // 1. Update existing organizations without email
    await knex('organizations')
        .whereNull('email')
        .orWhere('email', '')
        .update({ email: 'hello@gmail.com' });

    // 2. Ensure "Client" role exists
    let clientRole = await knex('roles').where({ name: 'Client' }).first();
    if (!clientRole) {
        const [insertedRole] = await knex('roles').insert({
            id: 9,
            name: 'Client',
            side: 'client',
            hierarchy_level: 9,
            description: 'Client accessing the portal'
        }).returning('*');
        clientRole = insertedRole || await knex('roles').where({ name: 'Client' }).first();
    }

    // 3. Add Client permissions (only if they don't exist yet)
    const modules = ['dashboard', 'projects'];
    const permissionsToInsert = [];
    for (const mod of modules) {
        const ext = await knex('permissions').where({ role_id: clientRole.id, module: mod }).first();
        if (!ext) {
            permissionsToInsert.push({
                role_id: clientRole.id,
                module: mod,
                can_view: true,
                can_create: false,
                can_edit: false,
                can_delete: false,
            });
        }
    }
    if (permissionsToInsert.length > 0) {
        await knex('permissions').insert(permissionsToInsert);
    }

    // 4. Provision users for existing organizations
    const orgs = await knex('organizations').where({ is_active: true });
    for (const org of orgs) {
        if (!org.email) continue;
        
        // Ensure no user has this email already
        const existingUser = await knex('users').where({ email: org.email }).first();
        if (!existingUser) {
            const password_hash = await bcrypt.hash('123456', 10);
            await knex('users').insert({
                first_name: org.name,
                last_name: 'Client',
                email: org.email,
                phone: org.phone || null,
                password_hash,
                role_id: clientRole.id,
                organization_id: org.id
            });
        }
    }
};

exports.down = async function (knex) {
    const clientRole = await knex('roles').where({ name: 'Client' }).first();
    if (clientRole) {
        await knex('users').where({ role_id: clientRole.id }).del();
        await knex('permissions').where({ role_id: clientRole.id }).del();
        await knex('roles').where({ id: clientRole.id }).del();
    }
};
