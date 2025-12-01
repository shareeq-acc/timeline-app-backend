// Set environment variables for testing BEFORE importing anything else
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5434/timeline_test';
process.env.TEST_DB_HOST = 'localhost';
process.env.TEST_DB_PORT = '5434';
process.env.TEST_DB_NAME = 'timeline_test';
process.env.TEST_DB_USER = 'postgres';
process.env.TEST_DB_PASSWORD = 'postgres';

// JWT Secrets for testing
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

import { beforeAll, beforeEach, afterAll } from '@jest/globals';

// Only import database helpers if we're running integration tests
// For unit tests (like validation tests), we skip database setup
const isIntegrationTest = process.env.JEST_IS_INTEGRATION === 'true';

let testDb: any;
let pool: any;
let allTables: any;

if (isIntegrationTest) {
    const dbHelper = require('./helpers/dbHelper');
    const dbConfig = require('../shared/config/db');
    const tables = require('../tables/tables');
    testDb = dbHelper.testDb;
    pool = dbConfig.pool;
    allTables = tables.allTables;
}

// Helper function to initialize test database schema
async function setupTestDatabase() {
    console.error('DEBUG: Starting setupTestDatabase');
    console.error(`DEBUG: testDb exists: ${!!testDb}`);
    console.error(`DEBUG: allTables length: ${allTables?.length}`);

    if (!testDb || !allTables) {
        console.error('DEBUG: Missing testDb or allTables, skipping setup');
        return;
    }

    try {
        // Test connection first
        await testDb.query('SELECT 1');
        console.error('DEBUG: Database connection successful');

        // Create all tables in the test database
        for (const table of allTables) {
            console.error(`DEBUG: Creating table ${table.name}`);
            try {
                await testDb.query(table.sql);
                console.error(`✓ Test DB: Table "${table.name}" created or already exists`);
            } catch (tableError: any) {
                console.error(`✗ Test DB: Failed to create table "${table.name}"`, tableError.message);
                throw tableError;
            }

            // Create triggers if they exist (skip dummy data for tests)
            if (table?.trigger) {
                try {
                    await testDb.query(table.trigger);
                    console.error(`✓ Test DB: Trigger for "${table.name}" created`);
                } catch (triggerError: any) {
                    console.error(`✗ Test DB: Failed to create trigger for "${table.name}"`, triggerError.message);
                    throw triggerError;
                }
            }
        }
        console.error('✓ Test database schema initialized successfully');
    } catch (error) {
        console.error('✗ Failed to set up test database tables', error);
        throw error;
    }
}

beforeAll(async () => {
    console.error('DEBUG: Running global beforeAll');
    // Initialize test database schema before running any tests
    if (isIntegrationTest) {
        await setupTestDatabase();
    }
});

beforeEach(async () => {
    // Clean up database to ensure isolation
    if (isIntegrationTest && testDb) {
        await testDb.query('DELETE FROM users');
    }
});

afterAll(async () => {
    // Close database connection pool
    if (isIntegrationTest && testDb && pool) {
        await testDb.end();
        await pool.end();
    }
});
