import { Pool } from 'pg';
import logger from '../utils/logger';
import { allTables } from '../../tables/tables';


// Option 1 for database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
});

// Option 2 for database connection
// export const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: Number(process.env.DB_PORT),
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
// });

export const initializeDatabase = async () => {
  try {
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
      if (table?.dummyData) {
        try {
          const result = await pool.query(table.dummyData.checkSql);
          const count = parseInt(result.rows[0].count, 10);

          if (count === 0) {
            await pool.query(table.dummyData.insertSql);
            logger.info(`Inserted dummy data into "${table.name}"`);
          } else {
            logger.info(`Skipped data insertion for "${table.name}" as it already contains data`);
          }
        } catch (dummyDataError: any) {
          logger.error(`Failed to insert dummy data into "${table.name}"`, {
            message: dummyDataError.message,
            code: dummyDataError.code,
            detail: dummyDataError.detail,
            stack: dummyDataError.stack,
          });
          throw dummyDataError;
        }
      }

      if (table?.trigger) {
        try {
          await pool.query(table.trigger);
          logger.info(`Table "${table.name}" created or already exists`);
        } catch (tableError: any) {
          logger.error(`Failed to create Trigger "${table.name}"`, {
            message: tableError.message,
            code: tableError.code, // PostgreSQL error code (e.g., '42P01')
            detail: tableError.detail, // Additional error info
            stack: tableError.stack,
          });
          throw tableError;
        }
      }
    }
    logger.info('Database setup completed');
  } catch (error) {
    logger.error('Failed to set up database tables', { error });
    throw error;
  }
};
