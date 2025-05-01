import { pool } from '../../../shared/config/db';
import { mapDbRowToTimeline } from '../utils/timelineMapper';
import { TimelineDbRow, TimelineIdentification, TimelineProps } from '../types/timeline.types';
import logger from '../../../shared/utils/logger';

export class Timeline {
    readonly id: string;
    readonly typeId: string;
    readonly timeUnitId: string;
    readonly duration: number;
    readonly title: string;
    readonly description: string;
    readonly isGenerated: boolean;
    readonly isPublic: boolean;
    readonly enableScheduling: boolean;
    readonly version: string;
    readonly authorId: string;
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(
        id: string,
        typeId: string,
        timeUnitId: string,
        duration: number,
        title: string,
        description: string,
        authorId: string,
        isGenerated: boolean = false,
        isPublic: boolean = true,
        enableScheduling: boolean = false,
        version: string = '1.0.0',
        createdAt?: string,
        updatedAt?: string
    ) {
        this.id = id;
        this.typeId = typeId;
        this.timeUnitId = timeUnitId;
        this.duration = duration;
        this.title = title;
        this.description = description;
        this.isGenerated = isGenerated;
        this.isPublic = isPublic;
        this.enableScheduling = enableScheduling || false;
        this.version = version;
        this.authorId = authorId;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
    }

    static async create(
        typeId: string,
        timeUnitId: string | null,
        duration: number | null,
        title: string,
        description: string,
        authorId: string,
        isPublic: boolean = true,
        enableScheduling: boolean = false,
    ): Promise<TimelineIdentification> {
        const query = `
                INSERT INTO timelines (
                    type_id, time_unit_id, duration, title, description, 
                    author_id, is_public, enable_scheduling
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
        const values = [
            typeId,
            timeUnitId,
            duration,
            title,
            description,
            authorId,
            isPublic,
            enableScheduling
        ];

        const result = await pool.query<TimelineDbRow>(query, values);
        const timeline = result.rows[0];
        const createdTimeline =  mapDbRowToTimeline(timeline);
        return {
            timelineId: createdTimeline.id
        }
    }

    static async findById(id: string): Promise<TimelineDbRow | null> {
        try {
            const query = `
            SELECT 
                t.*, 
                u.username AS author_username
            FROM timelines t
            JOIN users u ON t.author_id = u.id
            WHERE t.id = $1
        `;
            const result = await pool.query<TimelineDbRow>(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }
            const timeline = result.rows[0];
            return mapDbRowToTimeline(timeline);
        } catch (error) {
            logger.error('Error in findById', { error });
            return null;
        }
    }

    static async getByIdWithMetadata(timelineId: string): Promise<any> {
        const query = `
          SELECT 
            t.*, 
            tt.id as type_id, tt.type as type_name, tt.description as type_description,
            tt.needs_time_unit, tt.needs_duration, tt.supports_scheduling, tt.is_subscribable, 
            tt.created_at as type_created_at, tt.updated_at as type_updated_at,
            tu.id as time_unit_id, tu.code as time_unit_code, tu.description as time_unit_description,
            tu.duration_in_seconds, tu.updated_at as time_unit_updated_at
          FROM timelines t
          JOIN timeline_types tt ON t.type_id = tt.id
          LEFT JOIN time_units tu ON t.time_unit_id = tu.id
          WHERE t.id = $1
        `;

        const result = await pool.query(query, [timelineId]);
        return result.rows[0];
    }

    static async findByAuthorId(
        authorId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ timelines: TimelineDbRow[]; total: number }> {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) FROM timelines WHERE author_id = $1';
        const countResult = await pool.query<{ count: string }>(countQuery, [authorId]);
        const total = parseInt(countResult.rows[0].count);

        const query = `
                SELECT * FROM timelines 
                WHERE author_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `;
        const result = await pool.query<TimelineDbRow>(query, [authorId, limit, offset]);

        const timelines = result.rows.map(mapDbRowToTimeline);
        return { timelines, total };
    }
} 