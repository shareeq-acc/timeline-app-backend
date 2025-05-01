// TimelineService.ts
import { Timeline } from '../models/Timeline';
import { TimelineType } from '../models/TimelineType';
import { TimeUnit } from '../models/TimeUnit';
import { CreateTimelineRequestDto, GetTimelinesResponseDto, GetTimelinesMetadata, TimelineResponseDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';
import logger from '../../../shared/utils/logger';
import { mapTimelineToResponseDto } from '../utils/timelineMapper';
import { userService } from '../../user/services/userServices';
import { TimelineFork } from '../models/TimelineFork';
import { pool } from '../../../shared/config/db';

// Dependencies
import { segmentService } from '../../segment/services/segmentServices';
import { TimelineDbRow, TimelineIdentification } from '../types/timeline.types';

export class TimelineService {

    private async enrichTimeline(
        timeline: TimelineDbRow,
        includeForkDetails: boolean = true
    ): Promise<TimelineResponseDto> {
        try {
            // Get all required data in parallel
            const [timelineTypes, timeUnits, timelineFork] = await Promise.all([
                TimelineType.findAll(), // Uses cache
                TimeUnit.findAll(),     // Uses cache
                includeForkDetails ? TimelineFork.findForkedTimelineId(timeline.id) : null
            ]);

            // Find matching type and unit
            const timelineType = timelineTypes.find(type => type.id === timeline.typeId);
            const timeUnit = timeline.timeUnitId ?
                timeUnits.find(unit => unit.id === timeline.timeUnitId) :
                null;

            if (!timelineType) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'Timeline type not found'
                );
            }

            // Map to response DTO with the cached data
            return mapTimelineToResponseDto(
                timeline,
                timelineType,
                includeForkDetails,
                timeUnit ? timeUnit : null,
                timelineFork ? timelineFork : undefined
            );
        } catch (error) {
            logger.error('Error in enrichTimeline utility', { error, timelineId: timeline.id });
            throw error;
        }
    }

    async getMetadata(): Promise<GetTimelinesMetadata> {
        try {
            const [timelineTypes, timeUnits] = await Promise.all([
                TimelineType.findAll(),
                TimeUnit.findAll()
            ]);

            return {
                timelineTypes: timelineTypes,
                timeUnits: timeUnits
            };
        } catch (error) {
            logger.error('Error in getMetadata service', { error });
            throw error;
        }
    }

    async createTimeline(
        authorId: string,
        data: CreateTimelineRequestDto
    ): Promise<TimelineIdentification> {
        try {
            const timeline = await Timeline.create(
                data.typeId,
                data.timeUnitId || null,
                data.duration || null,
                data.title,
                data.description,
                authorId,
                data.isPublic ?? true,
                data.enableScheduling ?? false
            );

            // Populate Fields 
            return timeline;


        } catch (error) {
            logger.error('Error in createTimeline service', { error });
            throw error;
        }
    }

    async getTimelineById(timelineId: string, userId: string = ""): Promise<TimelineResponseDto> {
        try {
            const timeline = await Timeline.findById(timelineId);
            if ((!timeline) || (!timeline.isPublic && timeline.author.id !== userId)) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'Timeline not found'
                );
            }
            if (!timeline.isPublic && timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    ERROR_CODES.FORBIDDEN_ERROR.message,
                    'This Timeline is Private'
                );
            }
            return this.enrichTimeline(timeline, true);

        } catch (error) {
            logger.error('Error in getTimelineById service', { error });
            throw error;
        }
    }

    async getTimelinesByAuthorId(
        userId: string,
        authorId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<GetTimelinesResponseDto> {
        try {
            const isExistingUser = await userService.getUserById(authorId);
            if (!isExistingUser) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'User not found'
                );
            }
            const { timelines } = await Timeline.findByAuthorId(authorId, page, limit);

            // Filter timelines based on visibility rules
            const filteredTimelines = timelines.filter(timeline =>
                userId === authorId || timeline.isPublic
            );

            const mappedTimelines = [];

            for(let i=0; i<filteredTimelines.length; i++){
                const curr = await this.enrichTimeline(filteredTimelines[i]);
                mappedTimelines.push(curr)
            }


            return {
                timelines: mappedTimelines,
                total: filteredTimelines.length,
                page,
                limit,
            };
        } catch (error) {
            logger.error('Error in getTimelinesByAuthorId service', { error });
            throw error;
        }
    }

    async forkTimeline(timelineId: string, userId: string): Promise<TimelineIdentification> {
        let client;
        try {
            // Start a transaction
            client = await pool.connect();
            await client.query('BEGIN');

            // Get original timeline
            const originalTimeline = await Timeline.findById(timelineId);
            if (!originalTimeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'Timeline not found'
                );
            }

            // Check if timeline is accessible
            if (!originalTimeline.isPublic && originalTimeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    ERROR_CODES.FORBIDDEN_ERROR.message,
                    'Cannot fork private timeline'
                );
            }

            if (originalTimeline.author.id === userId) {
                throw new AppError(
                    ERROR_CODES.CONFLICT_ERROR.httpStatus,
                    ERROR_CODES.CONFLICT_ERROR.code,
                    ERROR_CODES.CONFLICT_ERROR.message,
                    'Cannot fork your own timeline'
                );
            }
            // Check if the user has already forked this timeline
            const existingFork = await TimelineFork.findByTimelineIdAndUserId(timelineId, userId);
            if (existingFork) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    ERROR_CODES.FORBIDDEN_ERROR.message,
                    'You have already forked this timeline'
                );
            }

            // Create new timeline with same properties
            const newTimeline = await Timeline.create(
                originalTimeline.typeId,
                originalTimeline.timeUnitId,
                originalTimeline.duration,
                `${originalTimeline.title} (Forked)`,
                originalTimeline.description,
                userId,
                false
            );

            // Get all segments from original timeline
            const segments = await segmentService.getSegmentsByTimelineId(timelineId, userId);
            if (segments.total === 0) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'No segments found'
                );
            }

            await segmentService.createBulkSegments(
                {
                    timelineId: newTimeline.timelineId,
                    segments: segments.segments.map(segment => ({
                        unitNumber: segment.unitNumber,
                        title: segment.title,
                        milestone: segment.milestone,
                        goals: segment.goals.map(g => g.goal),
                        references: segment.references.map(r => r.reference)
                    }))
                },
                userId,
            );

            // Create fork record
           await TimelineFork.create(
                originalTimeline.id,
                newTimeline.timelineId,
                userId,
                originalTimeline.version
            );

            // Commit transaction
            await client.query('COMMIT');

            return newTimeline;

        } catch (error) {
            if (client) {
                await client.query('ROLLBACK');
            }
            logger.error('Error in forkTimeline service', { error });
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async isTimelineForked(timelineId: string): Promise<TimelineFork | null> {
        const forkedTimeline = await TimelineFork.findForkedTimelineId(timelineId);
        if (!forkedTimeline) {
            return null;
        }
        return forkedTimeline;
    }

    async getTimelineType(timelineTypeId: string): Promise<TimelineType | null> {
        const timelineType = await TimelineType.findById(timelineTypeId);
        if (!timelineType) {
            return null;
        }
        return timelineType;
    }

    async getTimeUnit(timeUnitId: string): Promise<TimeUnit | null> {
        const timeUnit = await TimeUnit.findById(timeUnitId);
        if (!timeUnit) {
            return null;
        }
        return timeUnit;
    }

}

export const timelineService = new TimelineService(); 