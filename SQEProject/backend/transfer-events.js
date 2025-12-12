// Transfer events to organizer11@eventhub.com
const database = require('./config/database');

async function transferEvents() {
    try {
        console.log('🔧 Transferring events to organizer11@eventhub.com...\n');

        const fromOrganizerId = '488CB317-D530-46C3-91DB-154810151F38'; // organizer@eventhub.com
        const toOrganizerId = '8EE78487-C576-4C5C-9B74-7CFFFA476700';   // organizer11@eventhub.com

        // Update all events
        const result = await database.query(`
            UPDATE [Events].[Events]
            SET OrganizerId = @toOrganizerId
            WHERE OrganizerId = @fromOrganizerId
        `, { fromOrganizerId, toOrganizerId });

        console.log(`✅ Transferred ${result.rowsAffected[0]} events`);
        console.log(`   FROM: organizer@eventhub.com (${fromOrganizerId})`);
        console.log(`   TO:   organizer11@eventhub.com (${toOrganizerId})\n`);

        // Verify
        const verify = await database.query(`
            SELECT COUNT(*) as count FROM [Events].[Events]
            WHERE OrganizerId = @organizerId
        `, { organizerId: toOrganizerId });

        console.log(`✅ organizer11@eventhub.com now has ${verify.recordset[0].count} events\n`);
        console.log('🎉 Done! Refresh your organizer dashboard to see events and attendees.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

transferEvents();
