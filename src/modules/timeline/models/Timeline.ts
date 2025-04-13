import { pool } from '../../../shared/config/db';
import { TimeLineEnum, TimeUnitEnum } from '../types/enums';
import { mapDbRowToTimeline } from '../utils/timelineMapper';
import { TimelineDbRow, TimelineProps } from '../types/timelineTypes';
import logger from '../../../shared/utils/logger';

export class Timeline implements TimelineProps {
    id: string;
    type: TimeLineEnum;
    timeUnit: TimeUnitEnum;
    duration: number;
    title: string;
    description: string;
    isGenerated: boolean;
    prompt: string | null;
    isPublic: boolean;
    isForked: boolean;
    forkCount: number;
    originalTimelineId: string | null;
    version: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;

    constructor(
        id: string,
        type: TimeLineEnum,
        timeUnit: TimeUnitEnum,
        duration: number,
        title: string,
        description: string,
        authorId: string,
        isGenerated: boolean = false,
        prompt: string | null = null,
        isPublic: boolean = true,
        isForked: boolean = false,
        forkCount: number = 0,
        originalTimelineId: string | null = null,
        version: string = '1.0.0',
        createdAt?: string,
        updatedAt?: string
    ) {
        this.id = id;
        this.type = type;
        this.timeUnit = timeUnit;
        this.duration = duration;
        this.title = title;
        this.description = description;
        this.isGenerated = isGenerated;
        this.prompt = prompt;
        this.isPublic = isPublic;
        this.isForked = isForked;
        this.forkCount = forkCount;
        this.originalTimelineId = originalTimelineId;
        this.version = version;
        this.authorId = authorId;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
    }

    static async create(
        type: TimeLineEnum,
        timeUnit: TimeUnitEnum,
        duration: number,
        title: string,
        description: string,
        authorId: string,
        isPublic: boolean = true
    ): Promise<Timeline> {
        console.log("Public", isPublic);
        const query = `
                INSERT INTO timelines (
                    type, time_unit, duration, title, description, 
                    author_id, is_public, is_generated, prompt,
                    is_forked, fork_count, original_timeline_id, version
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, false, null, false, 0, null, '1.0.0')
                RETURNING *
            `;
        const values = [
            type, 
            timeUnit, 
            duration, 
            title, 
            description,
            authorId, 
            isPublic
        ];

        const result = await pool.query<TimelineDbRow>(query, values);
        const timeline = result.rows[0];
        return mapDbRowToTimeline(timeline);
    }

    static async findById(id: string): Promise<Timeline | null> {
        try {
            const query = 'SELECT * FROM timelines WHERE id = $1';
            const result = await pool.query<TimelineDbRow>(query, [id]);
    
            if (result.rows.length === 0) {
                return null;
            }
            const timeline = result.rows[0];
            return mapDbRowToTimeline(timeline);
        }catch(error){
            logger.error('Error in findById', { error });
            return null;
        }
    }

    static async findByAuthorId(
        authorId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ timelines: Timeline[]; total: number }> {
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