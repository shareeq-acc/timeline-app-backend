import { pool } from '../../../../shared/config/db';
import { TimelineDbRow, TimelineIdentification, TimelineProps } from './timeline.types';
import logger from '../../../../shared/utils/logger';
import { mapDbRowToTimeline } from './timelineDataMapper';

export function incrementVersion(versionStr: string): string {
  if (!versionStr) return '1.0.1';
  const parts = versionStr.split('.');
  if (parts.length >= 2) {
    const major = parts[0];
    const minor = parseInt(parts[1], 10);
    if (!isNaN(minor)) {
      const nextMinor = minor + 1;
      const patchAndRest = parts.slice(2);
      if (patchAndRest.length > 0) {
        return `${major}.${nextMinor}.${patchAndRest.join('.')}`;
      }
      return `${major}.${nextMinor}`;
    }
  }
  const parsed = parseFloat(versionStr);
  if (!isNaN(parsed)) {
    return (parsed + 0.1).toFixed(1);
  }
  return '1.0.0';
}

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
            WHERE t.id = $1 AND t.deleted_at IS NULL
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

        const countQuery = 'SELECT COUNT(*) FROM timelines WHERE author_id = $1 AND deleted_at IS NULL';
        const countResult = await pool.query<{ count: string }>(countQuery, [authorId]);
        const total = parseInt(countResult.rows[0].count);

        const query = `
                SELECT * FROM timelines 
                WHERE author_id = $1 AND deleted_at IS NULL
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
      WHERE (title ILIKE $1 OR description ILIKE $1) AND deleted_at IS NULL
    `;
    const countResult = await pool.query<{ count: string }>(countQuery, [`%${searchTerm}%`]);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT t.*, u.username AS author_username
      FROM timelines t
      JOIN users u ON t.author_id = u.id
      WHERE (t.title ILIKE $1 OR t.description ILIKE $1) AND t.deleted_at IS NULL
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
    limit: number = 10,
    excludeAuthorId?: string
  ): Promise<{ timelines: TimelineDbRow[]; total: number }> {
    const offset = (page - 1) * limit;
    
    let countQuery = `
      SELECT COUNT(*) 
      FROM timelines t
      WHERE t.type_id = $1 AND t.is_public = true AND t.deleted_at IS NULL
        AND (t.duration IS NULL OR (SELECT COUNT(*) FROM segments s WHERE s.timeline_id = t.id) >= t.duration)
    `;
    const countParams: any[] = [typeId];
    if (excludeAuthorId) {
      countQuery += ` AND t.author_id != $2`;
      countParams.push(excludeAuthorId);
    }
    const countResult = await pool.query<{ count: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    let query = `
      SELECT t.*, u.username AS author_username
      FROM timelines t
      JOIN users u ON t.author_id = u.id
      WHERE t.type_id = $1 AND t.is_public = true AND t.deleted_at IS NULL
        AND (t.duration IS NULL OR (SELECT COUNT(*) FROM segments s WHERE s.timeline_id = t.id) >= t.duration)
    `;
    const queryParams: any[] = [typeId];
    if (excludeAuthorId) {
      query += ` AND t.author_id != $2`;
      queryParams.push(excludeAuthorId);
    }
    
    const limitIndex = queryParams.length + 1;
    const offsetIndex = queryParams.length + 2;
    query += ` ORDER BY t.created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query<TimelineDbRow>(query, queryParams);
    
    return { 
      timelines: result.rows.map(mapDbRowToTimeline),
      total 
    };
  }

  static async update(
    id: string,
    data: { title?: string; description?: string; isPublic?: boolean }
  ): Promise<TimelineDbRow | null> {
    try {
      const current = await this.findById(id);
      if (!current) return null;

      const fields: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (data.title !== undefined) {
        fields.push(`title = $${index++}`);
        values.push(data.title);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${index++}`);
        values.push(data.description);
      }
      if (data.isPublic !== undefined) {
        fields.push(`is_public = $${index++}`);
        values.push(data.isPublic);
      }

      if (fields.length === 0) {
        return current;
      }

      const nextVersion = incrementVersion(current.version || '1.0.0');

      // Automatically increment version and update timestamp
      fields.push(`version = $${index++}`);
      values.push(nextVersion);
      
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(id);
      const query = `
        UPDATE timelines 
        SET ${fields.join(', ')} 
        WHERE id = $${index} 
        RETURNING *
      `;

      const result = await pool.query<TimelineDbRow>(query, values);
      if (result.rows.length === 0) return null;
      return mapDbRowToTimeline(result.rows[0]);
    } catch (error) {
      logger.error('Error in update', { error, id });
      return null;
    }
  }

  static async softDelete(id: string): Promise<boolean> {
    try {
      const query = `
        UPDATE timelines 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error in softDelete', { error, id });
      return false;
    }
  }
} 