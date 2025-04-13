import { Router } from 'express';
import authRoutes from '../src/modules/auth/routes/authRoutes';
import timelineRoutes from '../src/modules/timeline/routes/timelineRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/timeline', timelineRoutes);

export default router;