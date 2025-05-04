import { SegmentProps } from "../models/Segment/segment.types";

export interface CreateSegmentRequestDto {
    timelineId: string;
    unitNumber: number;
    title: string;
    goals: string[];
    references?: string[];
    milestone?: string;
    isForkModified?: boolean;
    startDate?: string;
    completedAt?: string;
}

export interface CreateBulkSegmentsRequestDto {
    timelineId: string;
    segments: Omit<CreateSegmentRequestDto, 'timelineId'>[];
}

export interface SegmentGoalResponseDto{
    id: string;
    goal: string;
}

export interface SegmentReferenceResponseDto{
    id: string;
    reference: string;
}

export interface SegmentResponseDto extends SegmentProps {
    goals: SegmentGoalResponseDto[];
    references: SegmentReferenceResponseDto[];
}

export interface CreateBulkSegmentsResponseDto {
    timelineId: string;
    segments: Omit<SegmentResponseDto, 'timelineId'>[];
}

export type UpdateSegmentRequestDto = Partial<SegmentResponseDto>;

export interface GetSegmentsResponseDto {
    segments: SegmentResponseDto[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateSegmentGoalDto {
    segmentId: string;
    goal: string;
}

export interface CreateSegmentReferenceDto {
    segmentId: string;
    reference: string;
} 

export interface CreateSchedulingDto {
    segmentId:string,
    scheduleDate: string,
}

export interface SchedulingResponseDto {
    scheduleDate: string | null;
    completedAt: string | null;
}

export interface SegmentExtendedDto extends SegmentResponseDto {
    scheduling?: SchedulingResponseDto;
}