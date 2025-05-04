import { z } from 'zod';
import { validateBody } from '../../../shared/utils/validation';

// Base schemas for reusable fields
const segmentBaseSchema = {
    unitNumber: z.number().int().positive('Unit number must be positive'),
    title: z.string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
    goals: z.array(z.string())
        .min(1, 'At least one goal is required')
        .max(10, 'Maximum 10 goals allowed'),
    references: z.array(z.string())
        .max(10, 'Maximum 10 references allowed')
        .optional(),
    milestone: z.string().optional(),
};

const createSegmentSchema = z.object({
    timelineId: z.string().uuid('Invalid timeline ID'),
    ...segmentBaseSchema,
});

const bulkCreateSegmentSchema = z.object({
    ...segmentBaseSchema,
});


// For update operations, make all fields optional
const updateSegmentSchema = z.object({
    ...Object.entries(segmentBaseSchema).reduce((acc, [key, schema]) => ({
        ...acc,
        [key]: schema.optional(),
    }), {}),
});

const createBulkSegmentsSchema = z.object({
    timelineId: z.string().uuid('Invalid timeline ID'),
    segments: z.array(bulkCreateSegmentSchema),
});


const validateScheduleSegmentSchema = z.object({
    scheduleDate: z.string()
        .datetime({ message: 'Schedule date must be a valid ISO 8601 datetime', offset: true })
        .refine((val) => new Date(val) >= new Date(), { message: 'Schedule date must be in the future' }),
});

// Type inference from schemas
export type CreateSegmentSchema = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentSchema = z.infer<typeof updateSegmentSchema>;
export type BulkCreateSegmentSchema = z.infer<typeof createBulkSegmentsSchema>;

export const dataValidation = {
    validateCreateSegment: validateBody(createSegmentSchema),
    validateUpdateSegment: validateBody(updateSegmentSchema),
    validateBulkSegments: validateBody(createBulkSegmentsSchema),
    validateScheduleSegment: validateBody(validateScheduleSegmentSchema),
};