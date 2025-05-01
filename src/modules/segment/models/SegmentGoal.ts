import { pool } from '../../../shared/config/db';
import { SegmentGoalProps, SegmentGoalDbRow } from '../types/segmentTypes';
import logger from '../../../shared/utils/logger';
import { PoolClient } from 'pg';
import { SegmentGoalResponseDto } from '../types/dtos';

export class SegmentGoal implements SegmentGoalProps {
    readonly id: string;
    readonly segmentId: string;
    readonly goal: string;
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(
        id: string,
        segmentId: string,
        goal: string,
        createdAt?: string,
        updatedAt?: string
    ) {
        this.id = id;
        this.segmentId = segmentId;
        this.goal = goal;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
    }

    static async create(client: PoolClient, segmentId: string, goal: string): Promise<SegmentGoal> {
        const query = `
            INSERT INTO segment_goals (segment_id, goal)
            VALUES ($1, $2)
            RETURNING *
        `;
        const values = [segmentId, goal];
    
        const result = await client.query(query, values);
        return this.mapDbRowToSegmentGoal(result.rows[0]);
    }

    static async getGoals(segmentId:string): Promise<SegmentGoalResponseDto[]> {
        const goals = await SegmentGoal.findBySegmentId(segmentId);
        return goals.map(g => ({ id: g.id, goal: g.goal }));
    }

    static async findBySegmentId(segmentId: string): Promise<SegmentGoal[]> {
        const query = 'SELECT * FROM segment_goals WHERE segment_id = $1';
        const result = await pool.query(query, [segmentId]);
        return result.rows.map(this.mapDbRowToSegmentGoal);
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM segment_goals WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    static async deleteBySegmentId(segmentId: string): Promise<boolean> {
        const query = 'DELETE FROM segment_goals WHERE segment_id = $1 RETURNING id';
        const result = await pool.query(query, [segmentId]);
        return result.rows.length > 0;
    }

    private static mapDbRowToSegmentGoal(row: SegmentGoalDbRow): SegmentGoal {
        return new SegmentGoal(
            row.id,
            row.segment_id,
            row.goal,
            row.created_at,
            row.updated_at
        );
    }
} 