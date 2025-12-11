// Create or update demo user passwords
require('dotenv').config();
const database = require('./config/database');
const bcrypt = require('bcryptjs');

async function setupDemoUsers() {
    try {
        await database.connect();
        console.log('✅ Connected to database\n');
        
        const demoPassword = 'Demo@123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(demoPassword, salt);
        
        // Update passwords for demo accounts
        const demoAccounts = [
            { email: 'user@eventhub.com', role: 'User' },
            { email: 'organizer@eventhub.com', role: 'Organizer' },
            { email: 'admin@eventhub.com', role: 'Admin' }
        ];
        
        console.log('🔐 Setting demo password: Demo@123\n');
        
        for (const account of demoAccounts) {
            await database.query(`
                UPDATE [Users].[Users]
                SET PasswordHash = @hashedPassword,
                    Salt = @salt,
                    EmailVerified = 1
                WHERE Email = @email
            `, {
                hashedPassword,
                salt,
                email: account.email
            });
            
            console.log(`✅ Updated ${account.role} account: ${account.email}`);
        }
        
        console.log('\n🎉 Demo accounts ready! Use these credentials to login:');
        console.log('\nUser Account:');
        console.log('  Email: user@eventhub.com');
        console.log('  Password: Demo@123');
        console.log('\nOrganizer Account:');
        console.log('  Email: organizer@eventhub.com');
        console.log('  Password: Demo@123');
        console.log('\nAdmin Account:');
        console.log('  Email: admin@eventhub.com');
        console.log('  Password: Demo@123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupDemoUsers();
