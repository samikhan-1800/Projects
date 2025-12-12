// Quick fix script to assign events to organizer@eventhub.com
const database = require('./config/database');

async function fixOrganizerEvents() {
    try {
        console.log('🔧 Fixing organizer event ownership...\n');

        // Get the organizer ID for organizer@eventhub.com
        const organizerResult = await database.query(`
            SELECT o.OrganizerId, o.OrganizationName, u.Email
            FROM [Users].[Organizers] o
            INNER JOIN [Users].[Users] u ON o.UserId = u.UserId
            WHERE u.Email = 'organizer@eventhub.com'
        `);

        if (organizerResult.recordset.length === 0) {
            console.error('❌ Organizer account not found!');
            process.exit(1);
        }

        const organizer = organizerResult.recordset[0];
        console.log('✅ Found organizer:', organizer);

        // Count current events
        const beforeCount = await database.query(`
            SELECT COUNT(*) as count FROM [Events].[Events]
            WHERE OrganizerId = @organizerId
        `, { organizerId: organizer.OrganizerId });

        console.log(`\n📊 Current events for ${organizer.Email}:`, beforeCount.recordset[0].count);

        // Check total events in database
        const totalEvents = await database.query(`
            SELECT COUNT(*) as count FROM [Events].[Events]
        `);

        console.log(`📊 Total events in database:`, totalEvents.recordset[0].count);

        // Update all events to belong to this organizer
        const updateResult = await database.query(`
            UPDATE [Events].[Events]
            SET OrganizerId = @organizerId
            WHERE OrganizerId != @organizerId OR OrganizerId IS NULL
        `, { organizerId: organizer.OrganizerId });

        console.log(`\n✅ Updated ${updateResult.rowsAffected[0]} events`);

        // Verify
        const afterCount = await database.query(`
            SELECT COUNT(*) as count FROM [Events].[Events]
            WHERE OrganizerId = @organizerId
        `, { organizerId: organizer.OrganizerId });

        console.log(`✅ Events now assigned to ${organizer.Email}:`, afterCount.recordset[0].count);

        // Show sample events
        const sampleEvents = await database.query(`
            SELECT TOP 5 EventId, Title, Status FROM [Events].[Events]
            WHERE OrganizerId = @organizerId
            ORDER BY CreatedAt DESC
        `, { organizerId: organizer.OrganizerId });

        console.log('\n📋 Sample events:');
        sampleEvents.recordset.forEach(event => {
            console.log(`  - ${event.Title} (${event.Status})`);
        });

        console.log('\n🎉 Done! Organizer dashboard should now show events and attendees.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixOrganizerEvents();
