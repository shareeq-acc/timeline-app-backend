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

