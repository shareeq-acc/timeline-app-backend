import { pool } from '../../../shared/config/db';
import logger from '../../../shared/utils/logger';
import { TimelineForkProps } from '../types/timelineFork.types';

export class TimelineFork implements TimelineForkProps {
    readonly id: string;
    readonly originalTimelineId: string;
    readonly forkedTimelineId: string;
    readonly forkedById: string;
    readonly forkedVersion: string;
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(
        id: string,
        originalTimelineId: string,
        forkedTimelineId: string,
        forkedById: string,
        forkedVersion: string,
        createdAt?: string,
        updatedAt?: string
    ) {
        this.id = id;
        this.originalTimelineId = originalTimelineId;
        this.forkedTimelineId = forkedTimelineId;
        this.forkedById = forkedById;
        this.forkedVersion = forkedVersion;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
    }

    static async create(
        originalTimelineId: string,
        forkedTimelineId: string,
        forkedById: string,
        forkedVersion: string
    ): Promise<TimelineFork> {
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
            const result = await pool.query(query, values);
            const fork = result.rows[0];
            return new TimelineFork(
                fork.id,
                fork.original_timeline_id,
                fork.forked_timeline_id,
                fork.forked_by_id,
                fork.forked_version,
                fork.forked_created_at
            );
        } catch (error) {
            logger.error('Error creating timeline fork', { error });
            throw error;
        }
    }

    static async findByTimelineIdAndUserId(timelineId: string, userId: string): Promise<TimelineFork | null> {
        const result = await pool.query(
            'SELECT * FROM timeline_forks WHERE original_timeline_id = $1 AND forked_by_id = $2',
            [timelineId, userId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new TimelineFork(
            result.rows[0].id,
            result.rows[0].original_timeline_id,
            result.rows[0].forked_timeline_id,
            result.rows[0].forked_by_id,
            result.rows[0].forked_version,
            result.rows[0].created_at,
            result.rows[0].updated_at
        );
    }

    static async findForkedTimelineId(timelineId: string): Promise<TimelineFork | null> {
        const result = await pool.query(
            'SELECT * FROM timeline_forks WHERE forked_timeline_id = $1',
            [timelineId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return new TimelineFork(
            result.rows[0].id,
            result.rows[0].original_timeline_id,
            result.rows[0].forked_timeline_id,
            result.rows[0].forked_by_id,
            result.rows[0].forked_version,
            result.rows[0].created_at,
            result.rows[0].updated_at   
        );
    }
}