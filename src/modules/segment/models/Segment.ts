import { pool } from '../../../shared/config/db';
import { CreateSegmentRequestDto, SegmentResponseDto, CreateBulkSegmentsRequestDto, SegmentExtendedDto } from '../types/dtos';
import { Timeline } from '../../timeline/models/Timeline';
import logger from '../../../shared/utils/logger';
import { mapDbRowToSegment } from '../utils/segmentMapper';
import { SegmentProps, SegmentSchedulingType, SegmentType } from '../types/segmentTypes';
import { error } from 'console';
import { SegmentGoal } from './SegmentGoal';
import { SegmentReference } from './SegmentReference';
import { SegmentDbRow, SegmentGoalDbRow, SegmentReferenceDbRow } from '../types/segmentTypes';
import { SegmentScheduling } from './SegmentScheduling';

export class Segment implements SegmentProps {
    readonly id: string;
    readonly timelineId: string;
    readonly unitNumber: number;
    readonly title: string;
    readonly milestone?: string;
    readonly isForkModified: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly completedAt?: string;
    readonly goals: Array<{ id: string; goal: string }>;
    readonly references: Array<{ id: string; reference: string }>;

    constructor(
        id: string,
        timelineId: string,
        unitNumber: number,
        title: string,
        milestone?: string,
        isForkModified?: boolean,
        startDate?: string,
        endDate?: string,
        completedAt?: string,
        createdAt?: string,
        updatedAt?: string,
        goals: Array<{ id: string; goal: string }> = [],
        references: Array<{ id: string; reference: string }> = []
    ) {
        this.id = id;
        this.timelineId = timelineId;
        this.unitNumber = unitNumber;
        this.title = title;
        this.isForkModified = false;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.milestone = milestone;
        this.completedAt = completedAt;
        this.goals = goals;
        this.references = references;
    }


    static async composeSegment(
        segment: SegmentType,
        isAuthor:boolean = false
    ): Promise<SegmentExtendedDto> {
        try {


            // Get Segment References and Segment Goals
            const [references, goals] = await Promise.all([
                SegmentReference.findBySegmentId(segment.id),
                SegmentGoal.findBySegmentId(segment.id)
            ]);

            let enrichedSegment :SegmentExtendedDto  = {
                ...segment,
                references: references.map((r) => ({
                    id: r.id,
                    reference: r.reference
                })),
                goals: goals.map((g) => ({
                    id: g.id,
                    goal: g.goal
                }))
            };

            if(isAuthor){

                // Check for segment scheduling
                const scheduling = await SegmentScheduling.findBySegmentId(segment.id);
                enrichedSegment = {
                    ...enrichedSegment,
                    scheduling: {
                        scheduleDate: scheduling?.scheduleDate ?? null,
                        completedAt: scheduling?.completedAt ?? null
                    }
                };
            }
            
            return enrichedSegment;

        } catch (error) {
            logger.error('Error in enrichTimeline utility', { error, timelineId: segment.id });
            throw error;
        }
    }

    static async create(data: CreateSegmentRequestDto): Promise<SegmentExtendedDto> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create segment
            const segmentQuery = `
                INSERT INTO segments (
                    timeline_id, unit_number, title, milestone
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const segmentValues = [
                data.timelineId,
                data.unitNumber,
                data.title,
                data.milestone || null
            ];

            const segmentResult = await client.query(segmentQuery, segmentValues);
            const segment = mapDbRowToSegment(segmentResult.rows[0]);

            // Create goals
            const goals: Array<{ id: string; goal: string }> = [];
            if (data.goals && data.goals.length > 0) {
                for (const goal of data.goals) {
                    const createdGoal = await SegmentGoal.create(client, segment.id, goal);
                    goals.push({ id: createdGoal.id, goal: createdGoal.goal });
                }
            }

            // Create references
            const references: Array<{ id: string; reference: string }> = [];
            if (data.references && data.references.length > 0) {
                for (const reference of data.references) {
                    const createdReference = await SegmentReference.create(client, segment.id, reference);
                    references.push({ id: createdReference.id, reference: createdReference.reference });
                }
            }

            await client.query('COMMIT');

            return {
                ...segment,
                goals,
                references,
            }

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findById(id: string): Promise<SegmentType | null> {
        try {
            const query = 'SELECT * FROM segments WHERE id = $1';
            const result = await pool.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return mapDbRowToSegment(result.rows[0]);
        } catch (error) {
            logger.error('Error in findById', { error });
            return null;
        }
    }

    static async findByTimelineId(
        timelineId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ segments: SegmentType[]; total: number }> {
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) FROM segments WHERE timeline_id = $1';
        const countResult = await pool.query(countQuery, [timelineId]);
        const total = parseInt(countResult.rows[0].count);

        const query = `
            SELECT * FROM segments 
            WHERE timeline_id = $1 
            ORDER BY unit_number ASC 
            LIMIT $2 OFFSET $3
        `;
        const result = await pool.query(query, [timelineId, limit, offset]);

        const segments = result.rows.map(mapDbRowToSegment);
        return { segments, total };
    }

    static async update(id: string, data: Partial<SegmentResponseDto>): Promise<SegmentType | null> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const updates: string[] = [];
            const values: any[] = [];
            let paramCount = 1;

            if (data.title !== undefined) {
                updates.push(`title = $${paramCount}`);
                values.push(data.title);
                paramCount++;
            }
            if (data.milestone !== undefined) {
                updates.push(`milestone = $${paramCount}`);
                values.push(data.milestone);
                paramCount++;
            }

            if (updates.length === 0) {
                return null;
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);

            const query = `
                UPDATE segments 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                return null;
            }

            const segment = mapDbRowToSegment(result.rows[0]);
        
            await client.query('COMMIT');
            return segment;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM segments WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    static async createBulk(data: CreateBulkSegmentsRequestDto): Promise<SegmentType[]> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const segments: SegmentType[] = [];
            for (const segmentData of data.segments) {
                const segment = await this.create({
                    ...segmentData,
                    timelineId: data.timelineId
                });
                segments.push(segment);
            }

            await client.query('COMMIT');
            return segments;
        } catch (error) {
            logger.error('Error in createBulkSegments', { error });
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findByUnitNumber(timelineId: string, unitNumber: number): Promise<SegmentType | null> {
        try {
            const query = 'SELECT * FROM segments WHERE timeline_id = $1 AND unit_number = $2';
            const result = await pool.query(query, [timelineId, unitNumber]);
            if (result.rows.length === 0) {
                return null;
            }
            return mapDbRowToSegment(result.rows[0]);
        } catch (error) {
            logger.error('Error in findByUnitNumber', { error });
            return null;
        }
    }
}
