import { SegmentSchedulingProps } from "./segmentSchedule.type";

export const mapDbRowToSegmentSchedule = (row: any): SegmentSchedulingProps => {
    return {
        id: row.id,
        segmentId: row.segment_id,
        scheduleDate: row.schedule_date,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
};