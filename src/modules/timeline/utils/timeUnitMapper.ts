import { TimeUnit } from "../models/TimeUnit";
import { TimeUnitDto } from "../types/timeUnit.types";

export const mapDbRowToTimeUnitPartial = (row: any): TimeUnitDto => {
    return {
        id: row.id,
        code: row.code,
    }
};

export const mapDbRowToTimeUnit = (row: any): TimeUnit => {
    return new TimeUnit({
        id: row.id,
        code: row.code,
        description: row.description,
        updatedAt: row.updated_at,
        durationInSeconds: row.duration_in_seconds,
    })
};