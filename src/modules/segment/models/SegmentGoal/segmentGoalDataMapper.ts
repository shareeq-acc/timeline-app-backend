import { SegmentGoalDbRow, SegmentGoalProps } from "./segmentGoal.type";


export const mapDbRowToSegmentGoal = (row: SegmentGoalDbRow): SegmentGoalProps => {
    return {
        id: row.id,
        segmentId: row.segment_id,
        goal: row.goal,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
};