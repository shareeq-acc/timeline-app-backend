import { z } from 'zod';
import { validateBody } from '../../../shared/utils/validation';

// Base schemas for reusable fields
const segmentBaseSchema = {
    unitNumber: z.number().int().positive('Unit number must be positive'),
    title: z.string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
    goals: z.array(z.string())
        .max(10, 'Maximum 10 goals allowed')
        .optional()
        .default([]),
    references: z.array(z.string())
        .max(10, 'Maximum 10 references allowed')
        .optional()
        .default([]),
    milestone: z.string().optional(),
    scheduleDate: z.string().optional().nullable(),
};

const createSegmentSchema = z.object({
    timelineId: z.string().uuid('Invalid timeline ID'),
    ...segmentBaseSchema,
});

const bulkCreateSegmentSchema = z.object({
    ...segmentBaseSchema,
});


const goalUpdateSchema = z.object({
    id: z.string().optional(),
    goal: z.string().min(1, 'Goal text is required')
});

const referenceUpdateSchema = z.object({
    id: z.string().optional(),
    reference: z.string().min(1, 'Reference text is required')
});

// For update operations, make all fields optional and support objects for goals/references
const updateSegmentSchema = z.object({
    timelineId: z.string().uuid('Invalid timeline ID').optional(),
    unitNumber: z.number().int().positive('Unit number must be positive').optional(),
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
    goals: z.array(goalUpdateSchema).optional(),
    references: z.array(referenceUpdateSchema).optional(),
    milestone: z.string().optional(),
    scheduleDate: z.string().optional().nullable(),
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


const generateSegmentsSchema = z.object({
    goal: z.string().min(1, 'Goal is required'),
    domain: z.string().optional(),
    skillLevel: z.string().optional(),
    targetAudience: z.string().optional(),
});

// Type inference from schemas
export type CreateSegmentSchema = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentSchema = z.infer<typeof updateSegmentSchema>;
export type BulkCreateSegmentSchema = z.infer<typeof createBulkSegmentsSchema>;
export type GenerateSegmentsSchema = z.infer<typeof generateSegmentsSchema>;

export const dataValidation = {
    validateCreateSegment: validateBody(createSegmentSchema),
    validateUpdateSegment: validateBody(updateSegmentSchema),
    validateBulkSegments: validateBody(createBulkSegmentsSchema),
    validateScheduleSegment: validateBody(validateScheduleSegmentSchema),
    validateGenerateSegments: validateBody(generateSegmentsSchema),
};