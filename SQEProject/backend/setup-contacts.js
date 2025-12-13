/**
 * Setup script to create ContactSubmissions table
 * Run: node setup-contacts.js
 */

const db = require('./config/database');

async function setupContactsTable() {
    try {
        console.log('🔧 Setting up ContactSubmissions table...');

        // Drop trigger if exists
        const dropTrigger = `
            IF OBJECT_ID('trg_ContactSubmissions_Update', 'TR') IS NOT NULL
                DROP TRIGGER trg_ContactSubmissions_Update;
        `;
        await db.query(dropTrigger);

        // Drop table if exists (for fresh setup)
        const dropTable = `
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactSubmissions')
                DROP TABLE ContactSubmissions;
        `;
        await db.query(dropTable);

        // Create table
        const createTable = `
            CREATE TABLE ContactSubmissions (
                contactId INT PRIMARY KEY IDENTITY(1,1),
                name NVARCHAR(100) NOT NULL,
                email NVARCHAR(100) NOT NULL,
                phone NVARCHAR(20),
                subject NVARCHAR(50) NOT NULL,
                message NVARCHAR(MAX) NOT NULL,
                newsletter BIT DEFAULT 0,
                status NVARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Replied', 'Resolved')),
                adminNotes NVARCHAR(MAX),
                createdAt DATETIME2 DEFAULT GETDATE(),
                updatedAt DATETIME2 DEFAULT GETDATE()
            );
        `;
        await db.query(createTable);
        console.log('✅ ContactSubmissions table created');

        // Create indexes
        const createIndexStatus = `
            CREATE INDEX idx_status ON ContactSubmissions(status);
        `;
        await db.query(createIndexStatus);
        console.log('✅ Status index created');

        const createIndexCreated = `
            CREATE INDEX idx_created ON ContactSubmissions(createdAt);
        `;
        await db.query(createIndexCreated);
        console.log('✅ CreatedAt index created');

        // Create update trigger
        const createTrigger = `
            CREATE TRIGGER trg_ContactSubmissions_Update
            ON ContactSubmissions
            AFTER UPDATE
            AS
            BEGIN
                SET NOCOUNT ON;
                UPDATE ContactSubmissions
                SET updatedAt = GETDATE()
                FROM ContactSubmissions cs
                INNER JOIN inserted i ON cs.contactId = i.contactId;
            END;
        `;
        await db.query(createTrigger);
        console.log('✅ Update trigger created');

        console.log('\n✨ ContactSubmissions table setup complete!');
        console.log('You can now use the contact form feature.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up contacts table:', error);
        process.exit(1);
    }
}

setupContactsTable();
