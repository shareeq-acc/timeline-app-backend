import { CreateTimelineRequestDto, GetTimelinesResponseDto, GetTimelinesMetadata, TimelineResponseDto } from '../Dtos/dtos';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';
import logger from '../../../shared/utils/logger';
import { userService } from '../../user/services/userServices';

// Dependencies
import { segmentService } from '../../segment/services/segmentServices';
import { TimelineDbRow, TimelineIdentification } from '../models/timeline/timeline.types';
import { withTransaction } from '../../../shared/db/withTransaction';
import { TimelineRepository } from '../models/timeline/TimelineRepository';
import { mapTimelineToResponseDto } from '../models/timeline/timelineDataMapper';
import { TimelineForkProps } from '../models/timelineFork/timelineFork.types';
import { TimelineForkRepository } from '../models/timelineFork/timelineForkRepository';
import { TimeUnitProps } from '../models/timeUnit/timeUnit.types';
import { TimeUnitRepository } from '../models/timeUnit/TimeUnitRepository';
import { TimelineTypeProps } from '../models/timelineTypes/timelineType.types';
import { TimelineTypeRepository } from '../models/timelineTypes/TimelineTypeRepository';

export class TimelineService {

    private async enrichTimeline(
        timeline: TimelineDbRow,
        includeForkDetails: boolean = true,
        cachedData?: {
            timelineTypes: TimelineTypeProps[],
            timeUnits: TimeUnitProps[],
            timelineForkCache?: TimelineForkProps | null
        }
    ): Promise<TimelineResponseDto> {
        try {

            const timelineTypes = cachedData?.timelineTypes || await TimelineTypeRepository.findAll();
            const timeUnits = cachedData?.timeUnits || await TimeUnitRepository.findAll();
            const timelineFork = includeForkDetails ? cachedData?.timelineForkCache || await this.isTimelineForked(timeline.id) : null;

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

    private checkTimelineAccess(timeline: TimelineDbRow, userId: string) {
        if (!timeline.isPublic && timeline.author.id !== userId) {
            throw new AppError(
                ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                ERROR_CODES.FORBIDDEN_ERROR.code,
                ERROR_CODES.FORBIDDEN_ERROR.message,
                'This Timeline is Private'
            );
        }
    }

    private async validateForkEligibility(originalTimeline: TimelineDbRow, userId: string) {
        if (originalTimeline.author.id === userId) {
            throw new AppError(
                ERROR_CODES.CONFLICT_ERROR.httpStatus,
                ERROR_CODES.CONFLICT_ERROR.code,
                ERROR_CODES.CONFLICT_ERROR.message,
                'Cannot fork your own timeline'
            );
        }
        if (!originalTimeline.isPublic) {
            throw new AppError(
                ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                ERROR_CODES.FORBIDDEN_ERROR.code,
                ERROR_CODES.FORBIDDEN_ERROR.message,
                'Cannot fork private timeline'
            );
        }

        const existingFork = await TimelineForkRepository.findByTimelineIdAndUserId(originalTimeline.id, userId);
        if (existingFork) {
            throw new AppError(
                ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                ERROR_CODES.FORBIDDEN_ERROR.code,
                ERROR_CODES.FORBIDDEN_ERROR.message,
                'You have already forked this timeline'
            );
        }

    }

    async isTimelineForked(timelineId: string): Promise<TimelineForkProps | null> {
        const forkedTimeline = await TimelineForkRepository.findForkedTimelineId(timelineId);
        if (!forkedTimeline) {
            return null;
        }
        return forkedTimeline;
    }

    async getTimelineType(timelineTypeId: string): Promise<TimelineTypeProps | null> {
        return await TimelineTypeRepository.findById(timelineTypeId);
    }

    async getTimeUnit(timeUnitId: string): Promise<TimeUnitProps | null> {
        return await TimeUnitRepository.findById(timeUnitId);
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
            const { timelines } = await TimelineRepository.findByAuthorId(authorId, page, limit);

            const timelineTypes = await TimelineTypeRepository.findAllExtended();
            const timeUnits = await TimeUnitRepository.findAllExtended();

            // Filter timelines based on visibility rules
            const filteredTimelines = timelines.filter(timeline =>
                userId === authorId || timeline.isPublic
            );

            const mappedTimelines = await Promise.all(
                filteredTimelines.map(timeline =>
                    this.enrichTimeline(timeline, false, {
                        timelineTypes,
                        timeUnits,
                    })
                )
            );


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

    async getMetadata(): Promise<GetTimelinesMetadata> {
        try {
            const [timelineTypes, timeUnits] = await Promise.all([
                TimelineTypeRepository.findAll(),
                TimeUnitRepository.findAll()
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
            const timeline = await TimelineRepository.create(
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
            const timeline = await TimelineRepository.findById(timelineId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'Timeline not found'
                );
            }

            this.checkTimelineAccess(timeline, userId);
            return this.enrichTimeline(timeline, true);

        } catch (error) {
            logger.error('Error in getTimelineById service', { error });
            throw error;
        }
    }

    async forkTimeline(timelineId: string, userId: string): Promise<TimelineIdentification> {
        return withTransaction(async (client) => {
            const originalTimeline = await TimelineRepository.findById(timelineId);
            if (!originalTimeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'Timeline not found'
                );
            }
            
            await this.validateForkEligibility(originalTimeline, userId);
            const newTimeline = await TimelineRepository.create(
                originalTimeline.typeId,
                originalTimeline.timeUnitId,
                originalTimeline.duration,
                `${originalTimeline.title} (Forked)`,
                originalTimeline.description,
                userId,
                false
            );

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
                client // Pass the client to ensure queries are within the same transaction
            );

            await TimelineForkRepository.create(
                originalTimeline.id,
                newTimeline.timelineId,
                userId,
                originalTimeline.version,
                client // Also update create() to accept an optional client
            );

            return newTimeline;
        });
    }
}

export const timelineService = new TimelineService(); 