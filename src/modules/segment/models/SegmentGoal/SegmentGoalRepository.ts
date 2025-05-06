import { PoolClient } from 'pg';
import { mapDbRowToSegmentGoal } from './segmentGoalDataMapper';
import { pool } from '../../../../shared/config/db';
import { SegmentGoalProps } from './segmentGoal.type';

export class SegmentGoalRepository  {
    
    static async create(client: PoolClient, segmentId: string, goal: string): Promise<SegmentGoalProps> {
        const query = `
            INSERT INTO segment_goals (segment_id, goal)
            VALUES ($1, $2)
            RETURNING *
        `;
        const values = [segmentId, goal];
    
        const result = await client.query(query, values);
        return mapDbRowToSegmentGoal(result.rows[0]);
    }

    static async findBySegmentId(segmentId: string): Promise<SegmentGoalProps[]> {
        const query = 'SELECT * FROM segment_goals WHERE segment_id = $1';
        const result = await pool.query(query, [segmentId]);
        return result.rows.map(mapDbRowToSegmentGoal);
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

    static async update(id: string, goal: string): Promise<SegmentGoalProps | null> {
        const query = `
            UPDATE segment_goals 
            SET goal = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, goal]);
        return result.rows[0] ? mapDbRowToSegmentGoal(result.rows[0]) : null;
    }
} 