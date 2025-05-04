import { PoolClient } from 'pg';
import { pool } from '../../../../shared/config/db';
import logger from '../../../../shared/utils/logger';
import { mapDbRowToTimelineFork } from './timelineForkDataMapper';
import { TimelineForkProps } from './timelineFork.types';

export class TimelineForkRepository  {
    
    static async create(
        originalTimelineId: string,
        forkedTimelineId: string,
        forkedById: string,
        forkedVersion: string,
        client?: PoolClient
    ): Promise<TimelineForkProps> {
        const query = `
            INSERT INTO timeline_forks (
                original_timeline_id, forked_timeline_id, 
                forked_by_id, forked_version
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [
            originalTimelineId,
            forkedTimelineId,
            forkedById,
            forkedVersion
        ];

        try {
            const dbClient =  client ?? pool; // Use transaction client if provided
            const result = await dbClient.query(query, values);
            const fork = result.rows[0];
            return mapDbRowToTimelineFork(fork);
        } catch (error) {

            logger.error('Error creating timeline fork', { error });
            throw error;
        }
    }

    static async findByTimelineIdAndUserId(timelineId: string, userId: string): Promise<TimelineForkProps | null> {
        const result = await pool.query(
            'SELECT * FROM timeline_forks WHERE original_timeline_id = $1 AND forked_by_id = $2',
            [timelineId, userId]
        );

        if (result.rows.length === 0) {
            return null;
        }
        return mapDbRowToTimelineFork(result.rows[0]);
    }

    static async findForkedTimelineId(timelineId: string): Promise<TimelineForkProps | null> {
        const result = await pool.query(
            'SELECT * FROM timeline_forks WHERE forked_timeline_id = $1',
            [timelineId]
        );

        if (result.rows.length === 0) {
            return null;
        }
        return mapDbRowToTimelineFork(result.rows[0]);
    }
}