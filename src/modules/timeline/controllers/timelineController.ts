import { Request, Response } from 'express';
import { CreateTimelineRequestDto, GetTimelinesResponseDto, GetTimelinesMetadata, TimelineResponseDto } from '../Dtos/dtos';
import { ApiResponse } from '../../../shared/types/responseTypes';
import { sendSuccess } from '../../../shared/utils/successHandler';
import { timelineService } from '../services/timelineServices';

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
    const userId = req.user || "";
    const { timelineId } = await timelineService.createTimeline(userId, req.body);
    const timeline = await timelineService.getTimelineById(timelineId, userId);
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
    req: Request<{ userId: string }, ApiResponse<GetTimelinesResponseDto>, {}, { page?: string; limit?: string }>,
    res: Response<ApiResponse<GetTimelinesResponseDto>>
) => {
    const userId = req.user || "";
    const authorId = req.params.userId || "";
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    const timelines = await timelineService.getTimelinesByAuthorId(userId, authorId, page, limit);
    sendSuccess(res, timelines, 'Timelines retrieved successfully');
};

/**
 * Gets metadata for timelines
 * @route GET /api/timelines/metadata
 * @param req Request
 * @param res Response with metadata
 */
export const getMetadata = async (
    req: Request,
    res: Response<ApiResponse<GetTimelinesMetadata>>
) => {
    const metadata = await timelineService.getMetadata();
    sendSuccess(res, metadata, 'Metadata retrieved successfully');
};


/**
 * Forks an existing timeline
 * @route POST /api/timelines/fork/:timelineId
 * @param req Request with timeline ID
 * @param res Response with forked timeline
 */
export const forkTimeline = async (
    req: Request<{ timelineId: string }>,
    res: Response<ApiResponse<TimelineResponseDto>>
) => {
    const timelineId = req.params.timelineId;
    const userId = req?.user || "";
    const forkedTimelineIdentification = await timelineService.forkTimeline(timelineId, userId);
    const forkedTimeline = await timelineService.getTimelineById(forkedTimelineIdentification.timelineId, userId)
    sendSuccess(res, forkedTimeline, 'Timeline forked successfully');
}; 