import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/authMiddleware';
import {
    createSegment,
    getSegmentById,
    getSegmentsByTimelineId,
    updateSegment,
    deleteSegment,
    createBulkSegments,
    markSegmentComplete,
    setScheduleDate
} from '../controllers/segmentController';
import { dataValidation } from '../validations/dataValidation';

const router = Router();

// Create a new segment for a timeline
router.post('/', authMiddleware.requireAuth, dataValidation.validateCreateSegment, createSegment);

// Create all Segments for a timeline
router.post('/bulk',authMiddleware.requireAuth, dataValidation.validateBulkSegments, createBulkSegments);

// Get a segment by ID
router.get('/:segmentId', authMiddleware.optionalAuth, getSegmentById);

// Get segments by timeline ID
router.get('/timeline/:timelineId', authMiddleware.optionalAuth, getSegmentsByTimelineId);

// Update a segment
router.put('/:segmentId', authMiddleware.requireAuth, dataValidation.validateUpdateSegment, updateSegment);

// Delete a segment
router.delete('/:segmentId', authMiddleware.requireAuth, deleteSegment);

// Mark a segment as complete
router.put(
    '/:segmentId/complete',
    authMiddleware.requireAuth,
    markSegmentComplete
);

// Schedule a segment
router.post(
    '/:segmentId/schedule',
    authMiddleware.requireAuth,
    dataValidation.validateScheduleSegment,
    setScheduleDate
);

export default router; 