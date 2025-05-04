import { PoolClient } from 'pg';
import { SegmentType } from './segment.types';
import { CreateBulkSegmentsRequestDto, CreateSegmentRequestDto, SegmentExtendedDto, SegmentResponseDto } from '../../dtos/dtos';
import { mapDbRowToSegment } from './segmentDataMapper';
import { pool } from '../../../../shared/config/db';
import logger from '../../../../shared/utils/logger';
import { SegmentReferenceRepository } from '../SegmentReference/SegmentReferenceRepository';
import { SegmentGoalRepository } from '../SegmentGoal/SegmentGoalRepository';
import { SegmentScheduleRepository } from '../SegmentSchedule/SegmentScheduleRepository';

export class SegmentRepository {

    static async composeSegment(
        segment: SegmentType,
        isAuthor: boolean = false
    ): Promise<SegmentExtendedDto> {
        try {
            // Get Segment References and Segment Goals
            const [references, goals] = await Promise.all([
                SegmentReferenceRepository.findBySegmentId(segment.id),
                SegmentGoalRepository.findBySegmentId(segment.id)
            ]);

            let enrichedSegment: SegmentExtendedDto = {
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

            if (isAuthor) {

                // Check for segment scheduling
                const scheduling = await SegmentScheduleRepository.findBySegmentId(segment.id);
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

    static async create(data: CreateSegmentRequestDto, client: PoolClient): Promise<SegmentExtendedDto> {
        // const client = dbClient;
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

        const goals = [];
        if (data.goals?.length) {
            for (const goal of data.goals) {
                const createdGoal = await SegmentGoalRepository.create(client, segment.id, goal);
                goals.push({ id: createdGoal.id, goal: createdGoal.goal });
            }
        }

        const references = [];
        if (data.references?.length) {
            for (const reference of data.references) {
                const createdReference = await SegmentReferenceRepository.create(client, segment.id, reference);
                references.push({ id: createdReference.id, reference: createdReference.reference });
            }
        }

        return {
            ...segment,
            goals,
            references,
        };
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

    static async createBulk(
        data: CreateBulkSegmentsRequestDto,
        externalClient?: PoolClient
    ): Promise<SegmentType[]> {
        const client = externalClient || await pool.connect();
        const shouldManageTransaction = !externalClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');
            const segments: SegmentType[] = [];
            for (const segmentData of data.segments) {
                const segment = await this.create({
                    ...segmentData,
                    timelineId: data.timelineId
                }, client); // pass the actual client
                segments.push(segment);
            }

            if (shouldManageTransaction) await client.query('COMMIT');
            return segments;
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!externalClient) client.release();
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
