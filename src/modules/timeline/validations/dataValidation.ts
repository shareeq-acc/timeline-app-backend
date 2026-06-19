import { z } from 'zod';
import { validateBody } from '../../../shared/utils/validation';

export const createTimelineSchema = z.object({
    typeId: z.string().optional(),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
    description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters'),
    timeUnitId: z.string().optional(),
    duration: z.number().int().positive('Duration must be a positive number').optional(),
    isPublic: z.boolean().optional().default(true),
    enableScheduling: z.boolean().optional()
});

export const dataValidation = {
    validateCreateTimeline: validateBody(createTimelineSchema)
}; 