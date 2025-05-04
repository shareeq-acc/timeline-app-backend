import { PoolClient } from "pg";
import { pool } from "../../../../shared/config/db";
import { mapDbRowToSegmentReference } from "./segmentReferenceDataMapper";
import { SegmentReferenceProps } from "./segmentReference.type";

export class SegmentReferenceRepository {
    static async create(client: PoolClient, segmentId: string, reference: string): Promise<SegmentReferenceProps> {
        const query = `
            INSERT INTO segment_references (segment_id, reference)
            VALUES ($1, $2)
            RETURNING *
        `;
        const values = [segmentId, reference];
    
        const result = await client.query(query, values);
        return mapDbRowToSegmentReference(result.rows[0]);
    }

    static async findBySegmentId(segmentId: string): Promise<SegmentReferenceProps[]> {
        const query = 'SELECT * FROM segment_references WHERE segment_id = $1';
        const result = await pool.query(query, [segmentId]);
        return result.rows.map(mapDbRowToSegmentReference);
    }

    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM segment_references WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    static async deleteBySegmentId(segmentId: string): Promise<boolean> {
        const query = 'DELETE FROM segment_references WHERE segment_id = $1 RETURNING id';
        const result = await pool.query(query, [segmentId]);
        return result.rows.length > 0;
    }

} 