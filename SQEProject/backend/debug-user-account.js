// Check which user account is being used
const database = require('./config/database');

async function checkUserAccount() {
    try {
        console.log('🔍 Checking user account from JWT token...\n');

        const jwtUserId = '08AEA725-3873-4DDF-8758-9E1E37784BF8'; // From the logs

        // Find this user
        const userResult = await database.query(`
            SELECT UserId, Email, FirstName, LastName, Role FROM [Users].[Users]
            WHERE UserId = @userId
        `, { userId: jwtUserId });

        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            console.log('✅ JWT Token User:');
            console.log(`   UserId: ${user.UserId}`);
            console.log(`   Email: ${user.Email}`);
            console.log(`   Name: ${user.FirstName} ${user.LastName}`);
            console.log(`   Role: ${user.Role}\n`);

            // Check if this user has an organizer profile
            const orgResult = await database.query(`
                SELECT OrganizerId, OrganizationName FROM [Users].[Organizers]
                WHERE UserId = @userId
            `, { userId: jwtUserId });

            if (orgResult.recordset.length > 0) {
                console.log('✅ This user HAS an organizer profile:');
                console.log(`   OrganizerId: ${orgResult.recordset[0].OrganizerId}`);
                console.log(`   Organization: ${orgResult.recordset[0].OrganizationName}\n`);

                // Check events for this organizer
                const eventsCount = await database.query(`
                    SELECT COUNT(*) as count FROM [Events].[Events]
                    WHERE OrganizerId = @organizerId
                `, { organizerId: orgResult.recordset[0].OrganizerId });

                console.log(`   Events: ${eventsCount.recordset[0].count}\n`);

                if (eventsCount.recordset[0].count === 0) {
                    console.log('⚠️  PROBLEM: This organizer has 0 events!');
                    console.log('   All events belong to a different organizer account.\n');

                    // Find the organizer that has events
                    const correctOrg = await database.query(`
                        SELECT o.OrganizerId, o.OrganizationName, u.Email
                        FROM [Users].[Organizers] o
                        INNER JOIN [Users].[Users] u ON o.UserId = u.UserId
                        WHERE u.Email = 'organizer@eventhub.com' AND u.UserId != @userId
                    `, { userId: jwtUserId });

                    if (correctOrg.recordset.length > 0) {
                        console.log('✅ Found correct organizer account:');
                        console.log(`   Email: ${correctOrg.recordset[0].Email}`);
                        console.log(`   OrganizerId: ${correctOrg.recordset[0].OrganizerId}\n`);

                        console.log('🔧 SOLUTION: Transfer events OR delete duplicate account');
                    }
                }
            } else {
                console.log('❌ This user does NOT have an organizer profile!');
                console.log('   This might be a regular user account.\n');
            }
        } else {
            console.log('❌ User not found with this UserId');
        }

        // Now check the CORRECT organizer account
        console.log('\n--- CORRECT ORGANIZER ACCOUNT ---\n');
        const correctUser = await database.query(`
            SELECT u.UserId, u.Email, u.FirstName, u.LastName, u.Role, o.OrganizerId, o.OrganizationName
            FROM [Users].[Users] u
            INNER JOIN [Users].[Organizers] o ON u.UserId = o.UserId
            WHERE u.Email = 'organizer@eventhub.com'
        `);

        if (correctUser.recordset.length > 0) {
            const org = correctUser.recordset[0];
            console.log('✅ Correct Organizer Account:');
            console.log(`   UserId: ${org.UserId}`);
            console.log(`   Email: ${org.Email}`);
            console.log(`   OrganizerId: ${org.OrganizerId}`);
            console.log(`   Organization: ${org.OrganizationName}\n`);

            const eventsCount = await database.query(`
                SELECT COUNT(*) as count FROM [Events].[Events]
                WHERE OrganizerId = @organizerId
            `, { organizerId: org.OrganizerId });

            console.log(`   Events: ${eventsCount.recordset[0].count}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUserAccount();
