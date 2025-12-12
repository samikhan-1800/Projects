// Check and fix duplicate organizer accounts
const database = require('./config/database');

async function checkDuplicates() {
    try {
        console.log('🔍 Checking for duplicate organizer accounts...\n');

        // Find all organizers for organizer@eventhub.com
        const result = await database.query(`
            SELECT 
                o.OrganizerId,
                o.UserId,
                o.OrganizationName,
                u.Email,
                u.FirstName,
                u.LastName,
                (SELECT COUNT(*) FROM [Events].[Events] WHERE OrganizerId = o.OrganizerId) as EventCount
            FROM [Users].[Organizers] o
            INNER JOIN [Users].[Users] u ON o.UserId = u.UserId
            WHERE u.Email = 'organizer@eventhub.com'
            ORDER BY o.CreatedAt
        `);

        console.log(`Found ${result.recordset.length} organizer record(s):\n`);
        result.recordset.forEach((org, index) => {
            console.log(`${index + 1}. OrganizerId: ${org.OrganizerId}`);
            console.log(`   UserId: ${org.UserId}`);
            console.log(`   Organization: ${org.OrganizationName}`);
            console.log(`   Events: ${org.EventCount}`);
            console.log('');
        });

        if (result.recordset.length > 1) {
            console.log('⚠️  PROBLEM: Multiple organizer records found!');
            console.log('   The JWT token might be using a different UserId.\n');

            // Find which one has events
            const withEvents = result.recordset.find(o => o.EventCount > 0);
            const withoutEvents = result.recordset.find(o => o.EventCount === 0);

            if (withEvents && withoutEvents) {
                console.log('🔧 FIX: Update all events to the organizer used in JWT token\n');
                
                // Update events to belong to the organizer that matches the JWT
                const update = await database.query(`
                    UPDATE [Events].[Events]
                    SET OrganizerId = @targetOrganizerId
                    WHERE OrganizerId = @sourceOrganizerId
                `, {
                    targetOrganizerId: withoutEvents.OrganizerId,
                    sourceOrganizerId: withEvents.OrganizerId
                });

                console.log(`✅ Moved ${update.rowsAffected[0]} events`);
                console.log(`   FROM: ${withEvents.OrganizerId}`);
                console.log(`   TO:   ${withoutEvents.OrganizerId}\n`);

                // Verify
                const verify = await database.query(`
                    SELECT COUNT(*) as count FROM [Events].[Events]
                    WHERE OrganizerId = @organizerId
                `, { organizerId: withoutEvents.OrganizerId });

                console.log(`✅ Organizer ${withoutEvents.OrganizerId} now has ${verify.recordset[0].count} events\n`);
            }
        } else {
            console.log('✅ No duplicates found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDuplicates();
