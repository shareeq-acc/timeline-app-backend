import { pool } from '../../../../shared/config/db';
import { TimelineDbRow, TimelineIdentification, TimelineProps } from './timeline.types';
import logger from '../../../../shared/utils/logger';
import { mapDbRowToTimeline } from './timelineDataMapper';

export class TimelineRepository {

    static async create(
        typeId: string,
        timeUnitId: string | null,
        duration: number | null,
        title: string,
        description: string,
        authorId: string,
        isPublic: boolean = true,
        enableScheduling: boolean = false
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
        const createdTimeline = mapDbRowToTimeline(timeline);
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