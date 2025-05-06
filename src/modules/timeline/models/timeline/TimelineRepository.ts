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

  static async markAsGenerated(timelineId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE timelines 
        SET is_generated = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await pool.query(query, [timelineId]);
      return result.rows[0] ? true : false;
    } catch (error) {
      logger.error('Error marking timeline as generated', { error, timelineId });
      return false;
    }
  }

  static async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ timelines: TimelineDbRow[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM timelines 
      WHERE (title ILIKE $1 OR description ILIKE $1)
    `;
    const countResult = await pool.query<{ count: string }>(countQuery, [`%${searchTerm}%`]);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT t.*, u.username AS author_username
      FROM timelines t
      JOIN users u ON t.author_id = u.id
      WHERE (t.title ILIKE $1 OR t.description ILIKE $1)
      ORDER BY t.created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query<TimelineDbRow>(query, [`%${searchTerm}%`, limit, offset]);
    
    return { 
      timelines: result.rows.map(mapDbRowToTimeline),
      total 
    };
  }

  static async findByType(
    typeId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ timelines: TimelineDbRow[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM timelines 
      WHERE type_id = $1 AND is_public = true
    `;
    const countResult = await pool.query<{ count: string }>(countQuery, [typeId]);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT t.*, u.username AS author_username
      FROM timelines t
      JOIN users u ON t.author_id = u.id
      WHERE t.type_id = $1 AND t.is_public = true
      ORDER BY t.created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query<TimelineDbRow>(query, [typeId, limit, offset]);
    
    return { 
      timelines: result.rows.map(mapDbRowToTimeline),
      total 
    };
  }
} 