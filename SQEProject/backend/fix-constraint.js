const database = require('./config/database');

async function fixConstraint() {
    try {
        console.log('🔍 Finding existing status constraints...');
        
        // Find all CHECK constraints on the Status column
        const constraints = await database.query(`
            SELECT 
                c.name AS constraint_name,
                t.name AS table_name,
                s.name AS schema_name
            FROM sys.check_constraints c
            INNER JOIN sys.tables t ON c.parent_object_id = t.object_id
            INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE t.name = 'Events' 
            AND s.name = 'Events'
            AND c.definition LIKE '%Status%'
        `);
        
        console.log(`Found ${constraints.recordset.length} constraint(s):`, constraints.recordset);
        
        // Drop all existing Status constraints
        for (const constraint of constraints.recordset) {
            console.log(`🗑️  Dropping constraint: ${constraint.constraint_name}`);
            await database.query(`
                ALTER TABLE [Events].[Events]
                DROP CONSTRAINT [${constraint.constraint_name}]
            `);
            console.log(`✅ Dropped: ${constraint.constraint_name}`);
        }
        
        // Add the new constraint with Rejected included
        console.log('➕ Adding new constraint with Rejected status...');
        await database.query(`
            ALTER TABLE [Events].[Events]
            ADD CONSTRAINT CK_Events_Status 
            CHECK ([Status] IN ('Draft', 'Pending', 'Approved', 'Published', 'Cancelled', 'Completed', 'Rejected'))
        `);
        
        console.log('✅ Successfully fixed status constraint!');
        console.log('✅ Rejected status is now allowed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to fix constraint:', err.message);
        console.error(err);
        process.exit(1);
    }
}

fixConstraint();
