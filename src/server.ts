import dotenv from 'dotenv';
dotenv.config();
import { initializeDatabase, setupDatabase } from './shared/config/db';
import logger from './shared/utils/logger';
import app from './app';


const startServer = async () => {
  try {
    await initializeDatabase();
    await setupDatabase(); 
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Server startup failed', { error });
    process.exit(1);
  }
};

startServer();