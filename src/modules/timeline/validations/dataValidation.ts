import { z } from 'zod';
import { validateBody } from '../../../shared/utils/validation';
import { TimeLineEnum, TimeUnitEnum } from '../types/enums';

const createTimelineSchema = z.object({
    type: z.nativeEnum(TimeLineEnum),
    timeUnit: z.nativeEnum(TimeUnitEnum),
    duration: z.number().int().positive('Duration must be a positive number'),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
    description: z
        .string()
        .min(1, 'Description is required')
        .max(500, 'Description must be less than 500 characters'),
    isPublic: z.boolean().optional().default(true)
});

export const dataValidation = {
    validateCreateTimeline: validateBody(createTimelineSchema)
}; 