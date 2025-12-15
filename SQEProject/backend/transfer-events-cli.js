// Transfer events between organizers (by OrganizerId)
// Usage:
//   node transfer-events-cli.js <fromOrganizerId> <toOrganizerId>
// Example:
//   node transfer-events-cli.js 488CB317-D530-46C3-91DB-154810151F38 8EE78487-C576-4C5C-9B74-7CFFFA476700

const database = require('./config/database');

const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
    const [fromOrganizerId, toOrganizerId] = process.argv.slice(2);

    if (!fromOrganizerId || !toOrganizerId) {
        console.error('❌ Missing arguments');
        console.error('Usage: node transfer-events-cli.js <fromOrganizerId> <toOrganizerId>');
        process.exit(1);
    }

    if (!guidRegex.test(fromOrganizerId) || !guidRegex.test(toOrganizerId)) {
        console.error('❌ Invalid GUID format.');
        process.exit(1);
    }

    console.log('🔧 Transferring events...');
    console.log('   FROM OrganizerId:', fromOrganizerId);
    console.log('   TO   OrganizerId:', toOrganizerId);

    const beforeFrom = await database.query(
        'SELECT COUNT(*) as count FROM [Events].[Events] WHERE OrganizerId = @organizerId',
        { organizerId: fromOrganizerId }
    );
    const beforeTo = await database.query(
        'SELECT COUNT(*) as count FROM [Events].[Events] WHERE OrganizerId = @organizerId',
        { organizerId: toOrganizerId }
    );

    console.log(`📊 Before: FROM has ${beforeFrom.recordset[0].count} events; TO has ${beforeTo.recordset[0].count} events`);

    const updateResult = await database.query(
        `UPDATE [Events].[Events]
         SET OrganizerId = @toOrganizerId
         WHERE OrganizerId = @fromOrganizerId`,
        { fromOrganizerId, toOrganizerId }
    );

    const moved = Array.isArray(updateResult.rowsAffected) ? updateResult.rowsAffected[0] : 0;
    console.log(`✅ Transferred ${moved} events`);

    const afterFrom = await database.query(
        'SELECT COUNT(*) as count FROM [Events].[Events] WHERE OrganizerId = @organizerId',
        { organizerId: fromOrganizerId }
    );
    const afterTo = await database.query(
        'SELECT COUNT(*) as count FROM [Events].[Events] WHERE OrganizerId = @organizerId',
        { organizerId: toOrganizerId }
    );

    console.log(`📊 After:  FROM has ${afterFrom.recordset[0].count} events; TO has ${afterTo.recordset[0].count} events`);
    console.log('🎉 Done! Refresh organizer dashboard to confirm events/attendees/payment receipts are correct.');

    process.exit(0);
}

main().catch((error) => {
    console.error('❌ Error transferring events:', error);
    process.exit(1);
});
