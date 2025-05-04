import { SegmentResponseDto } from "../../dtos/dtos";
import { SegmentGoalDbRow } from "../SegmentGoal/segmentGoal.type";
import { SegmentReferenceDbRow } from "../SegmentReference/segmentReference.type";
import { SegmentDbRow, SegmentType } from "./segment.types";

export const mapDbRowToSegment = (row: SegmentDbRow): SegmentType => {
    return {
        id: row.id,
        timelineId: row.timeline_id,
        unitNumber: row.unit_number,
        title: row.title,
        milestone: row.milestone,
        isForkModified: row.is_fork_modified,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
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