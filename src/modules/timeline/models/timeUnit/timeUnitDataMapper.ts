import { TimeUnitDto, TimeUnitProps } from "./timeUnit.types";

export const mapDbRowToTimeUnitPartial = (row: any): TimeUnitDto => {
    return {
        id: row.id,
        code: row.code,
    }
};

export const mapDbRowToTimeUnit = (row: any): TimeUnitProps => {
    return {
        id: row.id,
        code: row.code,
        description: row.description,
        durationInSeconds: row.duration_in_seconds, // new field added
        updatedAt: row.updated_at,
    }
};