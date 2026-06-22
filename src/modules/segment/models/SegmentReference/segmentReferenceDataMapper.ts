import { SegmentReferenceDbRow, SegmentReferenceProps } from "./segmentReference.type";

export const mapDbRowToSegmentReference = (row: SegmentReferenceDbRow): SegmentReferenceProps => {
    return {
        id: row.id,
        segmentId: row.segment_id,
        reference: row.reference,
        label: row.label,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
};