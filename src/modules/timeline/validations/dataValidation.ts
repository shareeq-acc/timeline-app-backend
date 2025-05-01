import { z } from 'zod';
import { validateBody } from '../../../shared/utils/validation';

export const createTimelineSchema = z.object({
    typeId: z.string().uuid('Timeline Type is not valid'),

    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),

    description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters'),

    
    // timeUnitId is only required for certain timeline types like Roadmap
    timeUnitId: z.string().uuid('Timeline Time Unit is not valid').optional(),

    // duration is only required for Roadmap-type timelines
    duration: z.number().int().positive('Duration must be a positive number').optional(),

    isPublic: z.boolean().optional().default(true)
});

export const dataValidation = {
    validateCreateTimeline: validateBody(createTimelineSchema)
}; 