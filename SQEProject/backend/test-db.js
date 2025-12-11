// Quick database connection test
require('dotenv').config();
const database = require('./config/database');

async function testConnection() {
    console.log('🔄 Testing database connection...');
    console.log('Configuration:', {
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME ? 'Using SQL Auth' : 'Using Windows Auth'
    });
    
    try {
        await database.connect();
        console.log('✅ Database connection successful!');
        
        const info = await database.getDatabaseInfo();
        console.log('📊 Database Info:', info);
        
        // Test a simple query
        const result = await database.query('SELECT COUNT(*) as userCount FROM [Users].[Users]');
        console.log('👥 Total users in database:', result.recordset[0].userCount);
        
        const eventsResult = await database.query('SELECT COUNT(*) as eventCount FROM [Events].[Events]');
        console.log('📅 Total events in database:', eventsResult.recordset[0].eventCount);
        
        console.log('\n✨ All tests passed! Database is ready.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('\nTroubleshooting steps:');
        console.error('1. Check if SQL Server is running');
        console.error('2. Verify database name:', process.env.DB_DATABASE);
        console.error('3. Check credentials in .env file');
        console.error('4. Ensure database tables are created (run schema scripts)');
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

testConnection();
