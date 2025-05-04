import { TimelineTypePartial, TimelineTypeProps } from "./timelineType.types"

export const mapDbRowToTimelineType = (row: any): TimelineTypeProps => {
    return {
        id: row.id,
        type: row.type,
        description: row.description,
        needsTimeUnit: row.needs_time_unit,
        needsDuration: row.needs_duration,
        supportsScheduling: row.supports_scheduling,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }   
}

export const mapDbRowToTimelineTypePartial = (row: any): TimelineTypePartial => {
    return {
        id: row.id,
        type: row.type,
        needsTimeUnit: row.needs_time_unit,
        needsDuration: row.needs_duration,
        supportsScheduling: row.supports_scheduling,
    }
}