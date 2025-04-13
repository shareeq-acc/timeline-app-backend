import { Pool } from 'pg';
import logger from '../utils/logger';
import { allTables } from '../../tables';


export const pool = new Pool({
  user: process.env.DB_USER as string,
  host: process.env.DB_HOST as string,
  database: process.env.DB_NAME as string,
  password: process.env.DB_PASS as string,
  port: parseInt(process.env.DB_PORT as string),
});

export const initializeDatabase = async () => {
  try {
    logger.info( process.env.DATABASE_URL);
    const client = await pool.connect();
    logger.info('PostgreSQL connected');
    client.release();
  } catch (error) {
    console.log(error);
    logger.error(`PostgreSQL connection failed  ${error}`, { error });
    process.exit(1);
  }
};

export const setupDatabase = async () => {
  try {
    for (const table of allTables) {
      try {
        await pool.query(table.sql);
        logger.info(`Table "${table.name}" created or already exists`);
      } catch (tableError: any) {
        logger.error(`Failed to create table "${table.name}"`, {
          message: tableError.message,
          code: tableError.code, // PostgreSQL error code (e.g., '42P01')
          detail: tableError.detail, // Additional error info
          stack: tableError.stack,
        });
        throw tableError;
      }
    }
    logger.info('Database setup completed');
  } catch (error) {
    logger.error('Failed to set up database tables', { error });
    throw error;
  }
};