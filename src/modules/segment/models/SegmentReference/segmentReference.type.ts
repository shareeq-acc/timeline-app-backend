export interface SegmentReferenceProps {
    id: string;
    segmentId: string;
    reference: string;
    label?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SegmentReferenceDbRow {
    id: string;
    segment_id: string;
    reference: string;
    label?: string;
    created_at: string;
    updated_at: string;
} 

