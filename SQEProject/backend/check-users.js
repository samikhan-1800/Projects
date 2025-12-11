// Check existing users in database
require('dotenv').config();
const database = require('./config/database');

async function checkUsers() {
    try {
        await database.connect();
        console.log('✅ Connected to database\n');
        
        const result = await database.query(`
            SELECT 
                UserId, Email, FirstName, LastName, Role, Status, EmailVerified, CreatedAt
            FROM [Users].[Users]
            ORDER BY CreatedAt DESC
        `);
        
        console.log(`📊 Found ${result.recordset.length} users:\n`);
        
        result.recordset.forEach((user, index) => {
            console.log(`${index + 1}. ${user.FirstName} ${user.LastName}`);
            console.log(`   Email: ${user.Email}`);
            console.log(`   Role: ${user.Role}`);
            console.log(`   Status: ${user.Status}`);
            console.log(`   Email Verified: ${user.EmailVerified}`);
            console.log(`   Created: ${new Date(user.CreatedAt).toLocaleString()}`);
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUsers();
