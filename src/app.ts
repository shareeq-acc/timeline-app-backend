import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import globalRoutes from "./routes"
import { errorMiddleware } from './shared/utils/errorHandler';
const app = express();

// Middleware
app.use(express.json()); 
app.use(cors({
  // origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true // Allow credentials (cookies)
})); 
app.use(cookieParser());
// app.use(requestLogger); // Log incoming requests


app.use('/api', globalRoutes);

// Global error handling 
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorMiddleware(err, req, res, next);
});

export default app;