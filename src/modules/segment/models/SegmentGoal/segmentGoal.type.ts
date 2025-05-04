export interface SegmentGoalProps {
    id: string;
    segmentId: string;
    goal: string;
    createdAt: string;
    updatedAt: string;
}

export interface SegmentGoalDbRow {
    id: string;
    segment_id: string;
    goal: string;
    created_at: string;
    updated_at: string;
}

