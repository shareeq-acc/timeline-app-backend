import { Request, Response } from 'express';
import { CreateSegmentRequestDto, UpdateSegmentRequestDto, SegmentResponseDto, GetSegmentsResponseDto, CreateBulkSegmentsRequestDto, SegmentExtendedDto } from '../dtos/dtos';
import { ApiResponse } from '../../../shared/types/responseTypes';
import { sendSuccess } from '../../../shared/utils/successHandler';
import { segmentService } from '../services/segmentServices';
import { GenerateSegmentsRequestDto } from '../../llm/dtos/dtos';

export const createSegment = async (
    req: Request<{}, ApiResponse<SegmentResponseDto>, CreateSegmentRequestDto>,
    res: Response<ApiResponse<SegmentResponseDto>>
) => {
    const userId = req.user || "";
    const segment = await segmentService.createSegment(req.body, userId);
    sendSuccess(res, segment, 'Segment created successfully', 201);
};

export const getSegmentById = async (
    req: Request<{ segmentId: string }, ApiResponse<SegmentResponseDto>>,
    res: Response<ApiResponse<SegmentResponseDto>>
) => {
    const segmentId = req.params.segmentId;
    const userId = req.user || "";

    const segment = await segmentService.getSegmentById(segmentId, userId);
    sendSuccess(res, segment, 'Segment retrieved successfully');
};

export const getSegmentsByTimelineId = async (
    req: Request<{ timelineId: string }, ApiResponse<GetSegmentsResponseDto>, {}, { page?: string; limit?: string }>,
    res: Response<ApiResponse<GetSegmentsResponseDto>>
) => {
    const userId = req.user || "";
    const timelineId = req.params.timelineId;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    const segments = await segmentService.getSegmentsByTimelineId(
        timelineId,
        userId,
        page,
        limit
    );
    sendSuccess(res, segments, 'Segments retrieved successfully');
};

export const updateSegment = async (
    req: Request<{ segmentId: string }, ApiResponse<SegmentResponseDto>, UpdateSegmentRequestDto>,
    res: Response<ApiResponse<SegmentResponseDto>>
) => {
    const userId = req.user || "";
    const segmentId = req.params.segmentId;
    const segment = await segmentService.updateSegment(segmentId, req.body, userId);
    sendSuccess(res, segment, 'Segment updated successfully');
};

export const deleteSegment = async (
    req: Request<{ segmentId: string }, ApiResponse<void>>,
    res: Response<ApiResponse<void>>
) => {
    const userId = req.user || "";
    const segmentId = req.params.segmentId;
    await segmentService.deleteSegment(segmentId, userId);
    sendSuccess(res, undefined, 'Segment deleted successfully');
};

export const createBulkSegments = async (
    req: Request<{}, ApiResponse<SegmentExtendedDto[]>, CreateBulkSegmentsRequestDto>,
    res: Response<ApiResponse<SegmentExtendedDto[]>>
) => {
    const userId = req.user || "";
    const timelineId = req.body.timelineId;
    const segments = await segmentService.createBulkSegments(req.body, userId);
    sendSuccess(res, { timelineId, segments }, 'Segments created successfully', 201);
};

export const markSegmentComplete = async (
    req: Request<{ segmentId: string }>,
    res: Response<ApiResponse<SegmentExtendedDto | {}>>
) => {
    const { segmentId } = req.params;
    const userId = req.user || "";
    const result = await segmentService.markSegmentComplete(segmentId, userId);
    sendSuccess(res, result, 'Segment marked as complete');
}; 


export const setScheduleDate = async (
    req: Request<{ segmentId: string }, ApiResponse<SegmentExtendedDto | {}>, { scheduleDate: string }>,
    res: Response<ApiResponse<SegmentExtendedDto | {}>>
) => {
    const { segmentId } = req.params || "";
    const userId = req.user || "";
    const scheduleDate = req.body.scheduleDate || "";
    const segment = await segmentService.updateSegmentScheduleDate(segmentId, scheduleDate, userId);
    sendSuccess(res, segment, 'Schedule date set successfully');
}

export const generateSegments = async (
    req: Request<{ timelineId: string }, ApiResponse<SegmentExtendedDto[]>, GenerateSegmentsRequestDto>,
    res: Response<ApiResponse<SegmentExtendedDto[]>>
) => {
    const userId = req.user || "";
    const timelineId = req.params.timelineId;
    const segments = await segmentService.generateSegments(timelineId, userId, req.body);
    sendSuccess(res, segments, 'Segments generated successfully');
}