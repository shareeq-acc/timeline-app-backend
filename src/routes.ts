import { Router } from 'express';
import authRoutes from '../src/modules/auth/routes/authRoutes';
import timelineRoutes from '../src/modules/timeline/routes/timelineRoutes';
import segmentRoutes from './modules/segment/routes/segmentRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/timeline', timelineRoutes); 
router.use('/segment', segmentRoutes);

export default router;