import { Timeline } from '../models/Timeline';
import { CreateTimelineRequestDto, TimelineResponseDto, GetTimelinesResponseDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';
import logger from '../../../shared/utils/logger';
import { mapTimelineToResponseDto } from '../utils/timelineMapper';

export class TimelineService {
    async createTimeline(
        authorId: string,
        data: CreateTimelineRequestDto
    ): Promise<TimelineResponseDto> {
        try {
            const timeline = await Timeline.create(
                data.type,
                data.timeUnit,
                data.duration,
                data.title,
                data.description,
                authorId,
                data.isPublic ?? true
            );
            return mapTimelineToResponseDto(timeline);
        } catch (error) {
            logger.error('Error in createTimeline service', { error });
            throw error;
        }
    }

    async getTimelineById(timelineId: string, userId: string = ""): Promise<TimelineResponseDto> {
        try {
            const timeline = await Timeline.findById(timelineId);
            if((!timeline ) || (!timeline.isPublic && timeline.authorId !== userId)){
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    ERROR_CODES.NOT_FOUND.message,
                    'Timeline not found'
                );
            }
            return mapTimelineToResponseDto(timeline);
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
            const { timelines } = await Timeline.findByAuthorId(authorId, page, limit);
            
            // Filter timelines based on visibility rules
            const filteredTimelines = timelines.filter(timeline => 
                userId === authorId || timeline.isPublic
            );
            
            return {
                timelines: filteredTimelines.map(mapTimelineToResponseDto),
                total: filteredTimelines.length,
                page,
                limit,
            };
        } catch (error) {
            logger.error('Error in getTimelinesByAuthorId service', { error });
            throw error;
        }
    }
}

export const timelineService = new TimelineService(); 