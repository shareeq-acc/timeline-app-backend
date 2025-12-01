import { Pool } from 'pg';
import dotenv from 'dotenv';
import { UserType } from '../../modules/user/models/User/usertypes';

// Load test environment
dotenv.config({ path: '.env.test' });

export const testDb = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'myapp_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
});

// Helper functions
export async function createTestUser(data: Partial<UserType>) {
  const result = await testDb.query(
    `INSERT INTO users (email, name, password_hash) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [data.email, data.fname, data.password]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const result = await testDb.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}