import { SegmentReferenceDbRow, SegmentReferenceProps } from "./segmentReference.type";

export const mapDbRowToSegmentReference = (row: SegmentReferenceDbRow): SegmentReferenceProps => {
    return {
        id: row.id,
        segmentId: row.segment_id,
        reference: row.reference,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
};