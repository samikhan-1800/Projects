const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'EventHubDB',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Use Windows Authentication if username/password are not provided
if (process.env.DB_USERNAME && process.env.DB_PASSWORD) {
    config.user = process.env.DB_USERNAME;
    config.password = process.env.DB_PASSWORD;
    console.log('🔐 Using SQL Server Authentication');
} else {
    config.options.trustedConnection = true;
    console.log('🔐 Using Windows Authentication');
}

class Database {
    constructor() {
        this.pool = null;
    }

    async connect() {
        try {
            if (!this.pool) {
                this.pool = await sql.connect(config);
                console.log('✅ Connected to SQL Server database');
            }
            return this.pool;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }

    async query(queryString, params = {}) {
        try {
            await this.connect();
            const request = this.pool.request();
            
            // Add parameters to request
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });

            const result = await request.query(queryString);
            return result;
        } catch (error) {
            console.error('❌ Database query failed:', error.message);
            throw error;
        }
    }

    async execute(procedureName, params = {}) {
        try {
            await this.connect();
            const request = this.pool.request();
            
            // Add parameters to request
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });

            const result = await request.execute(procedureName);
            return result;
        } catch (error) {
            console.error('❌ Stored procedure execution failed:', error.message);
            throw error;
        }
    }

    async close() {
        try {
            if (this.pool) {
                await this.pool.close();
                this.pool = null;
                console.log('🔌 Database connection closed');
            }
        } catch (error) {
            console.error('❌ Error closing database connection:', error.message);
        }
    }

    // Health check method
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 AS healthy');
            return result.recordset[0].healthy === 1;
        } catch (error) {
            return false;
        }
    }

    // Get database info
    async getDatabaseInfo() {
        try {
            const result = await this.query(`
                SELECT 
                    DB_NAME() AS DatabaseName,
                    @@VERSION AS Version,
                    GETDATE() AS CurrentTime
            `);
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Failed to get database info:', error.message);
            return null;
        }
    }
}

// Export singleton instance
const database = new Database();

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Closing database connection...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Closing database connection...');
    await database.close();
    process.exit(0);
});

module.exports = database;