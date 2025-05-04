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

