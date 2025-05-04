import { ForkDetails, TimelineForkProps } from "./timelineFork.types"

export const mapDbRowToTimelineFork = (row: any): TimelineForkProps => {
    return {
        id: row.id,
        originalTimelineId: row.original_timeline_id,
        forkedTimelineId: row.forked_timeline_id,
        forkedById: row.forked_by_id,
        forkedVersion: row.forked_version,
        updatedAt: row.updated_at,
        createdAt: row.created_at
    }   
}


export const mapDbRowToTimelineForkDetails = (row: any): ForkDetails => {
    return {
        id: row.id,
        originalTimelineId: row.original_timeline_id,
        forkedById: row.forked_by_id,
        forkedVersion: row.forked_version,
    }   
}