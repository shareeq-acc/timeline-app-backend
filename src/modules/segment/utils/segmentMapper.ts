import { Segment } from '../models/Segment';
import { SegmentDbRow, SegmentGoalDbRow, SegmentProps, SegmentReferenceDbRow, SegmentType } from '../types/segmentTypes';
import { SegmentResponseDto } from '../types/dtos';

export const mapDbRowToSegment = (row: SegmentDbRow): SegmentType => {
    return new Segment(
        row.id,
        row.timeline_id,
        row.unit_number,
        row.title,
        row.milestone,
        row.is_fork_modified,
        row.created_at,
        row.updated_at
    );
};

export const mapSegmentToResponseDto = async (segment: SegmentType, segmentGoals:SegmentGoalDbRow[], segmentReferences:SegmentReferenceDbRow[]): Promise<SegmentResponseDto> => {

    return {
        id: segment.id,
        timelineId: segment.timelineId,
        unitNumber: segment.unitNumber,
        title: segment.title,
        goals: segmentGoals.map((goal) => ({
            id: goal.id,
            goal: goal.goal
        })),
        references: segmentReferences.map((reference) => ({
            id: reference.id,
            reference: reference.reference
        })),
        milestone: segment.milestone,
        isForkModified: segment.isForkModified,
        createdAt: segment.createdAt,
        updatedAt: segment.updatedAt
    };
}; 