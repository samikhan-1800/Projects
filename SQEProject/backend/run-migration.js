const database = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📝 Running database migration...');
        
        const sqlPath = path.join(__dirname, '../database/add_rejected_status.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by GO statements and execute each batch separately
        const batches = sql.split(/\bGO\b/gi).filter(batch => batch.trim());
        
        for (const batch of batches) {
            if (batch.trim()) {
                await database.query(batch);
            }
        }
        
        console.log('✅ Migration completed successfully: Rejected status added to Events table');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error(err);
        process.exit(1);
    }
}

runMigration();
