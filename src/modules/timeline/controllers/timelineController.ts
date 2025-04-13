import { Request, Response } from 'express';
import { CreateTimelineRequestDto, TimelineResponseDto, GetTimelinesResponseDto } from '../types/dtos';
import { ApiResponse } from '../../../shared/types/responseTypes';
import { sendSuccess } from '../../../shared/utils/successHandler';
import { timelineService } from '../services/timelineServices';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';


/**
 * Creates a new timeline
 * @route POST /api/timelines
 * @param req Request body with timeline details
 * @param res Response with created timeline
 */
export const createTimeline = async (
    req: Request<{}, ApiResponse<TimelineResponseDto>, CreateTimelineRequestDto>,
    res: Response<ApiResponse<TimelineResponseDto>>
) => {
    const authorId = req.user || "" ;
    const timeline = await timelineService.createTimeline(authorId, req.body);
    sendSuccess(res, timeline, 'Timeline created successfully', 201);
};

/**
 * Gets a single timeline by ID
 * @route GET /api/timelines/:id
 * @param req Request with timeline ID
 * @param res Response with timeline details
 */
export const getTimelineById = async (
    req: Request<{ id: string }, ApiResponse<TimelineResponseDto>>,
    res: Response<ApiResponse<TimelineResponseDto>>
) => {
    const timeline = await timelineService.getTimelineById(req.params.id, req.user || "");
    sendSuccess(res, timeline, 'Timeline retrieved successfully');
};

/**
 * Gets all timelines for a user
 * @route GET /api/timelines
 * @param req Request with optional pagination parameters
 * @param res Response with timelines and pagination info
 */
export const getTimelinesByAuthorId = async (
    req: Request<{userId: string }, ApiResponse<GetTimelinesResponseDto>, {}, { page?: string; limit?: string }>,
    res: Response<ApiResponse<GetTimelinesResponseDto>>
) => {
    const authorId = req.user || ""
    const userId = req.params.userId || ""
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    const timelines = await timelineService.getTimelinesByAuthorId(userId, authorId, page, limit);
    sendSuccess(res, timelines, 'Timelines retrieved successfully');
}; 