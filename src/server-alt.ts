import app from './app';
import dotenv from 'dotenv';
// import { DataSource } from 'typeorm';
import logger from './shared/utils/logger';

dotenv.config();

// const AppDataSource = new DataSource({
//   type: 'postgres',
//   url: process.env.DATABASE_URL,
//   logging: true,
//   entities: ['modules/**/models/*.ts'],
// });

async function startServer() {
  try {
    // await AppDataSource.initialize();
    // logger.info('Database connected successfully');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Error during Data Source initialization:', error);
    process.exit(1);
  }
}

startServer();