import { pool } from '../../../shared/config/db';
import logger from '../../../shared/utils/logger';
import { TimeUnitDbRow, TimeUnitPartial, TimeUnitProps } from '../types/timeUnit.types';
import { mapDbRowToTimeUnit, mapDbRowToTimeUnitPartial } from '../utils/timeUnitMapper';

export class TimeUnit implements TimeUnitProps {
    id: string;
    code: string;
    description: string;
    updatedAt: string;
    durationInSeconds: number;

    constructor(data: TimeUnitProps) {
        this.id = data.id;
        this.code = data.code;
        this.description = data.description || "";
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.durationInSeconds = data.durationInSeconds || 0;
    }

    // ====== 🧠 Add static cache ======
    private static cache: TimeUnitProps[] | null = null;
    private static cacheTimestamp: number = 0;
    private static CACHE_TTL = 60 * 5 * 1000; // 5 minutes

    static getCachedData(now: number): TimeUnitProps[] | null {
        if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
            return this.cache;
        }
        return null;
    }

    static setCachedData(data: TimeUnitProps[]): void {
        this.cache = data;
        this.cacheTimestamp = Date.now();
    }

    static clearCache() {
        this.cache = null;
        this.cacheTimestamp = 0;
    }

    static async findAll(): Promise<TimeUnitPartial[]> {
        try {
            const query = 'SELECT * FROM time_units ORDER BY code';
            const result = await pool.query<TimeUnitDbRow>(query);
            return result.rows.map(row => mapDbRowToTimeUnitPartial(row));
        } catch (error) {
            logger.error('Error in findAll time units', { error });
            throw error;
        }
    }

    static async findAllExtended(): Promise<TimeUnitProps[]> {
        try {
            const now = Date.now();
            const cachedData = this.getCachedData(now);
            if (cachedData) {
                return cachedData;
            }

            const query = 'SELECT * FROM time_units ORDER BY code';
            const result = await pool.query<TimeUnitDbRow>(query);
            const timeUnits = result.rows.map(row => mapDbRowToTimeUnit(row));
            
            // Update cache
            this.setCachedData(timeUnits);

            return timeUnits;
        } catch (error) {
            logger.error('Error in findAll time units', { error });
            throw error;
        }
    }

    static async findById(id: string): Promise<TimeUnitProps | null> {
        try {
            const now = Date.now();
            const cachedData = this.getCachedData(now);
            if (cachedData) {
                return cachedData.find(unit => unit.id === id) || null;
            }

            const query = 'SELECT * FROM time_units WHERE id = $1';
            const result = await pool.query<TimeUnitDbRow>(query, [id]);
            return result.rows.map(row => mapDbRowToTimeUnit(row))[0] || null;
        } catch (error) {
            logger.error('Error in findById time units', { error });
            return null;
        }
    }
} 