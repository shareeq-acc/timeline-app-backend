export interface SegmentProps {
    id: string;
    timelineId: string;
    unitNumber: number;
    title: string;
    milestone?: string;
    isForkModified: boolean;
    createdAt: string;
    updatedAt: string;
}

export type SegmentType = SegmentProps;

export interface SegmentDbRow {
    id: string;
    timeline_id: string;
    unit_number: number;
    title: string;  
    milestone: string;
    is_fork_modified: boolean;
    created_at: string;         
    updated_at: string;
}

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

export interface SegmentReferenceProps {
    id: string;
    segmentId: string;
    reference: string;
    createdAt: string;
    updatedAt: string;
}

export interface SegmentReferenceDbRow {
    id: string;
    segment_id: string;
    reference: string;
    created_at: string;
    updated_at: string;
} 

export interface SegmentSchedulingType {
    id: string;
    segmentId: string;
    scheduleDate?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}
