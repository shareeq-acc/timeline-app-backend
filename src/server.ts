import dotenv from 'dotenv';
dotenv.config();
import { initializeDatabase, setupDatabase } from './shared/config/db';
import logger from './shared/utils/logger';
import app from './app';


const startServer = async () => {
  try {
    await initializeDatabase();
    await setupDatabase(); 
    app.listen(process.env.PORT, () => {
      logger.info(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    logger.error('Server startup failed', { error });
    process.exit(1);
  }
};

startServer();