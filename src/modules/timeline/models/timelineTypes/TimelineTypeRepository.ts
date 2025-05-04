import { pool } from "../../../../shared/config/db";
import logger from "../../../../shared/utils/logger";
import { TimelineTypePartial, TimelineTypeProps } from "./timelineType.types";
import { mapDbRowToTimelineType, mapDbRowToTimelineTypePartial } from "./timelineTypeDataMapper";

export class TimelineTypeRepository {

    // ====== static cache ======
    private static cache: TimelineTypeProps[] | null = null;
    private static cacheTimestamp: number = 0;
    private static CACHE_TTL = 60 * 5 * 1000; // 5 minutes

    static getCachedData(now: number): TimelineTypeProps[] | null {
        if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
            return this.cache;
        }
        return null;
    }
    static setCachedData(data: TimelineTypeProps[]): void {
        this.cache = data;
        this.cacheTimestamp = Date.now();
    }

    static async findAll(): Promise<TimelineTypePartial[]> {
        try {
            const query = 'SELECT * FROM timeline_types';
            const result = await pool.query(query);
            return result.rows.map(row => mapDbRowToTimelineTypePartial(row));
        } catch (error) {
            logger.error('Error in findAll timeline types', { error });
            throw error;
        }
    }

    static async findAllExtended(): Promise<TimelineTypeProps[]> {
        try {
            const now = Date.now();
            const cachedData = this.getCachedData(now);
            if (cachedData) {
                return cachedData;
            }

            const query = 'SELECT * FROM timeline_types ORDER BY code';
            const result = await pool.query(query);
            const timelineTypes = result.rows.map(row => mapDbRowToTimelineType(row));
            
            // Update cache
            this.setCachedData(timelineTypes);

            return timelineTypes;
        } catch (error) {
            logger.error('Error in findAllExtended timeline types', { error });
            throw error;
        }
    }

    static async findById(id: string): Promise<TimelineTypeProps | null> {
        try {
            const now = Date.now();
            const cachedData = this.getCachedData(now);
            if (cachedData) {
                return cachedData.find(type => type.id === id) || null;
            }

            const query = 'SELECT * FROM timeline_types WHERE id = $1';
            const result = await pool.query(query, [id]);
            return result.rows.map(row => mapDbRowToTimelineType(row))[0] || null;
        } catch (error) {
            logger.error('Error in findById timeline types', { error });
            return null;
        }
    }

    static clearCache() {
        this.cache = null;
        this.cacheTimestamp = 0;
    }
} 