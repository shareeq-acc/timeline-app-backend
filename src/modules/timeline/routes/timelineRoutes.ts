import { Router } from 'express';
import { dataValidation } from '../validations/dataValidation';
import { createTimeline, getTimelineById, getTimelinesByAuthorId, getMetadata, forkTimeline, searchTimelines, exploreTimelines } from '../controllers/timelineController';
import { authMiddleware } from '../../../shared/middleware/authMiddleware';
import { validateTimelineBusinessRules } from '../validations/customTimelineValidations';

const router = Router();


// Get metadata
router.get('/metadata', getMetadata);

// Search timelines
router.get('/search', searchTimelines);

// Explore timelines
router.get('/explore', exploreTimelines);

// Create a new timeline
router.post('/', authMiddleware.requireAuth, dataValidation.validateCreateTimeline, validateTimelineBusinessRules, createTimeline);

// Get a single timeline
// If the user is not authenticated, only get the timeline if it is a public timeline
// If the user is authenticated, get the timeline for the user (Public or Private)
router.get('/:id', authMiddleware.optionalAuth, getTimelineById);

// Get all timelines for the user
// If the user is not authenticated, get all timelines that are public
// If the user is authenticated, get all timelines for the user (Public and Private)
router.get('/user/:userId', authMiddleware.optionalAuth, getTimelinesByAuthorId);


// Fork a timeline
router.post('/fork/:timelineId', authMiddleware.requireAuth, forkTimeline);


export default router; 