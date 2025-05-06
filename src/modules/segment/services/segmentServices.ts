import { CreateSegmentRequestDto, UpdateSegmentRequestDto, SegmentResponseDto, GetSegmentsResponseDto, CreateBulkSegmentsRequestDto, SegmentExtendedDto } from '../dtos/dtos';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';
import logger from '../../../shared/utils/logger';

// Dependencies
import { timelineService } from '../../timeline/services/timelineServices';
import { PoolClient } from 'pg';
import { withTransaction } from '../../../shared/db/withTransaction';
import { SegmentRepository } from '../models/Segment/SegmentRepository';
import { SegmentScheduleRepository } from '../models/SegmentSchedule/SegmentScheduleRepository';
import { SegmentSchedulingProps } from '../models/SegmentSchedule/segmentSchedule.type';
import { GenerateSegmentsRequestDto, GenerateSegmentsRequirements } from '../../llm/dtos/dtos';
import { llmServices } from '../../llm/services/llmServices';
import { userService } from '../../user/services/userServices';
import { SegmentGoalRepository } from '../models/SegmentGoal/SegmentGoalRepository';
import { SegmentReferenceRepository } from '../models/SegmentReference/SegmentReferenceRepository';

export class SegmentService {

    async createSegment(
        data: CreateSegmentRequestDto,
        userId: string
    ): Promise<SegmentResponseDto> {
        try {
            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(data.timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The Timeline you are trying to create a segment for does not exist'
                );
            }

            if (timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to create segments for this timeline'
                );
            }

            const existingSegments = await this.getSegmentsByTimelineId(data.timelineId, userId);
            const unitsExisting = existingSegments.segments.map((segment) => segment.unitNumber);
            const existingLength = existingSegments.total;

            const maxLength = timeline.duration;

            if (existingLength >= maxLength) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Segment creation failed',
                    'The total number of segments exceeds the timeline duration'
                );
            }

            // Check if current Unit Number already exists
            if (unitsExisting.includes(data.unitNumber)) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Unit number already exists',
                    'The unit number you are trying to create already exists in the timeline'
                );
            }
            // Check if unit number is out of range
            if (data.unitNumber < 1 || data.unitNumber > maxLength) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Unit number out of range',
                    'The unit number you are trying to create is out of range'
                );
            }

            return await withTransaction(async (client: PoolClient) => {
                return await SegmentRepository.create(data, client);
            })
        } catch (error) {
            logger.error('Error in createSegment service', { error });
            throw error;
        }
    }

    async getSegmentById(id: string, userId: string): Promise<SegmentExtendedDto> {
        try {
            const segment = await SegmentRepository.findById(id);
            if (!segment) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Segment not found',
                    'The Segment you are trying to view does not exist'
                );
            }

            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(segment.timelineId, userId);
            if (!timeline || (!timeline.isPublic && timeline.author.id !== userId)) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'You do not have permission to view this segment',
                    'Access denied'
                );
            }

            const isAuthor: boolean = timeline.author.id === userId;
            return SegmentRepository.composeSegment(segment, isAuthor);
        } catch (error) {
            logger.error('Error in getSegmentById service', { error });
            throw error;
        }
    }

    async getSegmentsByTimelineId(
        timelineId: string,
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<GetSegmentsResponseDto> {
        try {
            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline you are trying to view segments for does not exist'
                );
            }

            if (!timeline.isPublic && timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to view segments for this timeline'
                );
            }

            const isAuthor: boolean = timeline.author.id === userId;
            const { segments, total } = await SegmentRepository.findByTimelineId(timelineId, page, limit);

            const enhancedSegments = []
            for (let i = 0; i < segments.length; i++) {
                const enhancedSegment = SegmentRepository.composeSegment(segments[i], isAuthor);
                enhancedSegments.push(enhancedSegment);
            }
            const segmentsWithDetails = await Promise.all(enhancedSegments);

            return {
                segments: segmentsWithDetails,
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error in getSegmentsByTimelineId service', { error });
            throw error;
        }
    }

    async updateSegment(
        id: string,
        data: UpdateSegmentRequestDto,
        userId: string
    ): Promise<SegmentExtendedDto> {
        try {
            const segment = await SegmentRepository.findById(id);
            if (!segment) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Segment not found',
                    'The segment you are trying to update does not exist'
                );
            }

            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(segment.timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline for this segment does not exist'
                );
            }

            if (timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to update segments for this timeline'
                );
            }

            const updatedSegment = await SegmentRepository.update(id, data);
            if (!updatedSegment) {
                throw new AppError(
                    ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                    ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                    'Update failed',
                    'Failed to update segment'
                );
            }


            return SegmentRepository.composeSegment(updatedSegment, true);
        } catch (error) {
            logger.error('Error in updateSegment service', { error });
            throw error;
        }
    }

    async deleteSegment(id: string, userId: string): Promise<void> {
        try {
            const segment = await SegmentRepository.findById(id);
            if (!segment) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Segment not found',
                    'The segment you are trying to delete does not exist'
                );
            }

            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(segment.timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline for this segment does not exist'
                );
            }

            if (timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to delete segments for this timeline'
                );
            }

            const deleted = await SegmentRepository.delete(id);
            if (!deleted) {
                throw new AppError(
                    ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                    ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                    'Delete failed',
                    'Failed to delete segment'
                );
            }
        } catch (error) {
            logger.error('Error in deleteSegment service', { error });
            throw error;
        }
    }

    async createBulkSegments(
        data: CreateBulkSegmentsRequestDto,
        userId: string,
        client?: PoolClient
    ): Promise<SegmentExtendedDto[]> {
        try {
            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(data.timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline you are trying to create segments for does not exist'
                );
            }

            if (timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to create segments for this timeline'
                );
            }

            const existingSegments = await this.getSegmentsByTimelineId(data.timelineId, userId);
            const unitsExisting = existingSegments.segments.map((segment) => segment.unitNumber);
            const existingLength = existingSegments.total;

            const maxLength = timeline.duration;
            const currentLength = data.segments.length;

            if (existingLength + currentLength > maxLength) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Segment creation failed',
                    'The total number of segments exceeds the timeline duration'
                );
            }

            // Check for duplicate unit numbers
            const duplicateUnits = data.segments.filter((segment) => unitsExisting.includes(segment.unitNumber));
            if (duplicateUnits.length > 0) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Duplicate unit numbers',
                    'The following unit numbers already exist: ' + duplicateUnits.map((segment) => segment.unitNumber).join(', ')
                );
            }
            // Check for unit number conflicts
            const unitNumbers = data.segments.map((segment) => segment.unitNumber);
            const unitNumberConflicts = unitNumbers.filter((unitNumber, index) => unitNumbers.indexOf(unitNumber) !== index);
            if (unitNumberConflicts.length > 0) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Unit number conflicts',
                    'The following unit numbers are conflicting: ' + unitNumberConflicts.join(', ')
                );
            }
            // Check for unit number out of range
            const unitNumberOutOfRange = unitNumbers.filter((unitNumber) => unitNumber < 1 || unitNumber > maxLength);
            if (unitNumberOutOfRange.length > 0) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Unit number out of range',
                    'The following unit numbers are out of range: ' + unitNumberOutOfRange.join(', ')
                );
            }
            // Check for unit number gaps
            const unitNumbersSet = new Set(unitNumbers);
            const unitNumberGaps = [];
            for (let i = 1; i <= maxLength; i++) {
                if (!unitNumbersSet.has(i)) {
                    unitNumberGaps.push(i);
                }
            }
            if (unitNumberGaps.length > 0) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Unit number gaps',
                    'The following unit numbers are missing: ' + unitNumberGaps.join(', ')
                );
            }


            const segments = await SegmentRepository.createBulk(data, client);
            let detailedSegments = [];
            for (const segment of segments) {
                const currentSegment = SegmentRepository.composeSegment(segment, true);
                detailedSegments.push(currentSegment);
            }

            return Promise.all(detailedSegments);
        } catch (error) {
            logger.error('Error in createBulkSegments service', { error });
            throw error;
        }
    }

    async markSegmentComplete(id: string, userId: string): Promise<SegmentExtendedDto> {
        try {
            const segment = await SegmentRepository.findById(id);
            if (!segment) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Segment not found',
                    'The segment you are trying to mark as complete does not exist'
                );
            }

            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(segment.timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline for this segment does not exist'
                );
            }

            if (timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to mark segments as complete for this timeline'
                );
            }

            const segmentSch = await SegmentScheduleRepository.findBySegmentId(id);
            if (segmentSch?.completedAt) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Segment already completed',
                    'The segment is already marked as complete'
                );
            }

            const completedSegment = await SegmentScheduleRepository.markComplete(id);
            if (!completedSegment) {
                throw new AppError(
                    ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
                    ERROR_CODES.INTERNAL_SERVER_ERROR.code,
                    'Mark complete failed',
                    'Failed to mark segment as complete'
                );
            }
            // const nextSegment = await Segment.findByUnitNumber(segment.timelineId, segment.unitNumber + 1);
            // if (nextSegment) {
            //     // Check if completed Segment was completed on Time
            //     const duration = segmentSch?.scheduleDate ? new Date(segmentSch.scheduleDate).getTime() : 0;
            //     const completedAt = new Date().getTime();
            //     const timeDiff = completedAt - duration;

            //     const temp = timeline?.timeUnit?.id || "";
            //     const timeUnit = await timelineService.getTimeUnit(temp);
            //     const timeUnitValue = timeUnit?.durationInSeconds;

            //     if (timeUnitValue && timeDiff > timeUnitValue * 1000) {
            //         // Segment was Over Due. Schedule Next Segment from now
            //         const currentTime = new Date().toISOString();
            //         await SegmentScheduling.updateScheduleDate(nextSegment.id, currentTime);
            //     }else {
            //         // start next Segment from expected Completion Date


            //     }


            // }

            return SegmentRepository.composeSegment(segment, true);
        } catch (error) {
            logger.error('Error in markSegmentComplete service', { error });
            throw error;
        }
    }

    async updateSegmentScheduleDate(
        id: string,
        startDate: string,
        userId: string
    ): Promise<SegmentSchedulingProps> {

        try {
            const segment = await SegmentRepository.findById(id);
            if (!segment) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Segment not found',
                    'The segment you are trying to update does not exist'
                );
            }

            // Verify timeline exists and user has access
            const timeline = await timelineService.getTimelineById(segment.timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline for this segment does not exist'
                );
            }

            if (timeline.author.id !== userId) {
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to update segments for this timeline'
                );
            }

            if (!timeline.enableScheduling) {
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Scheduling not enabled',
                    'The timeline does not have scheduling enabled'
                );
            }

            const unitNumber = segment.unitNumber;
            if (unitNumber != 1) {
                // Check if previous segment is marked as completed
                const previousSegment = await SegmentRepository.findByUnitNumber(segment.timelineId, unitNumber - 1);
                if (!previousSegment) {
                    throw new AppError(
                        ERROR_CODES.NOT_FOUND.httpStatus,
                        ERROR_CODES.NOT_FOUND.code,
                        'Previous segment not found',
                        'The previous segment does not exist'
                    );
                }
                const previousSegmentSchedule = await SegmentScheduleRepository.findBySegmentId(previousSegment.id);
                if (!previousSegmentSchedule) {
                    throw new AppError(
                        ERROR_CODES.NOT_FOUND.httpStatus,
                        ERROR_CODES.NOT_FOUND.code,
                        'Previous segment schedule not found',
                        'The previous segment schedule does not exist'
                    );
                }
                if (!previousSegmentSchedule.completedAt) {
                    throw new AppError(
                        ERROR_CODES.BAD_REQUEST.httpStatus,
                        ERROR_CODES.BAD_REQUEST.code,
                        'Previous segment not completed',
                        'The previous segment is not marked as completed'
                    );
                }
                if (previousSegmentSchedule?.scheduleDate && previousSegmentSchedule?.scheduleDate > startDate) {
                    throw new AppError(
                        ERROR_CODES.BAD_REQUEST.httpStatus,
                        ERROR_CODES.BAD_REQUEST.code,
                        'Start date cannot be before previous segment',
                        'The start date cannot be before the previous segment schedule date'
                    );
                }
            }

            const currentTime = new Date().toISOString();
            return await SegmentScheduleRepository.updateScheduleDate(id, currentTime);

        } catch (error) {
            logger.error('Error in updateSegmentStartDate service', { error });
            throw error;
        }
    }

    async generateSegments(timelineId: string, userId: string, data: GenerateSegmentsRequirements): Promise<SegmentExtendedDto[]> {
        try {
            const timeline = await timelineService.getTimelineById(timelineId, userId);
            if (!timeline) {
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'Timeline not found',
                    'The timeline you are trying to generate segments for does not exist'
                );
            }

            if(timeline.author.id !== userId){
                throw new AppError(
                    ERROR_CODES.FORBIDDEN_ERROR.httpStatus,
                    ERROR_CODES.FORBIDDEN_ERROR.code,
                    'Access denied',
                    'You do not have permission to generate segments for this timeline'
                );
            }

            const timelineType = await timelineService.getTimelineType(timeline.type.id);
            if(!timelineType || !timelineType?.supportGeneration){
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Timeline type does not support generation',
                    'The timeline type does not support generation'
                );
            }

            // get user credits
            const user = await userService.getUserById(userId);
            if(!user){
                throw new AppError(
                    ERROR_CODES.NOT_FOUND.httpStatus,
                    ERROR_CODES.NOT_FOUND.code,
                    'User not found',
                    'User not found'
                );
            }

            const credits = user.credits;
            const requestData = {
                ...data,
                credits: credits,
                title: timeline.title,
                timeUnit:timeline.timeUnit?.code || "",
                duration: timeline.duration,
                type: timeline.type.type
            }

            // Generate segments
            const segmentResponse = await llmServices.generateSegments(requestData);
            if(!segmentResponse || !segmentResponse?.segments || segmentResponse?.segments?.length === 0){
                throw new AppError(
                    ERROR_CODES.BAD_REQUEST.httpStatus,
                    ERROR_CODES.BAD_REQUEST.code,
                    'Bad Request',
                    'Failed to generate segments'
                );
            }

            const creditsUsed = segmentResponse.creditsUsed;
            const newCredits = credits - creditsUsed;
            await userService.updateCredits(userId, newCredits);

            // Create Segments
            const segments = await this.createBulkSegments({
                timelineId: timelineId,
                segments: segmentResponse.segments
            }, userId);

            await timelineService.updateTimelineGeneration(timelineId, userId);
            
            return segments;

        } catch (error) {
            logger.error('Error in generateSegments service', { error });
            throw error;
        }
    }
}

export const segmentService = new SegmentService(); 