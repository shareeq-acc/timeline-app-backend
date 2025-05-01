import { pool } from '../../../shared/config/db';
import { SegmentReferenceProps, SegmentReferenceDbRow } from '../types/segmentTypes';
import logger from '../../../shared/utils/logger';
import { PoolClient } from 'pg';
import { SegmentReferenceResponseDto } from '../types/dtos';

export class SegmentReference implements SegmentReferenceProps {
    readonly id: string;
    readonly segmentId: string;
    readonly reference: string;
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(
        id: string,
        segmentId: string,
        reference: string,
        createdAt?: string,
        updatedAt?: string
    ) {
        this.id = id;
        this.segmentId = segmentId;
        this.reference = reference;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
    }

    static async create(client: PoolClient, segmentId: string, reference: string): Promise<SegmentReference> {
        const query = `
            INSERT INTO segment_references (segment_id, reference)
            VALUES ($1, $2)
            RETURNING *
        `;
        const values = [segmentId, reference];
    
        const result = await client.query(query, values);
        return this.mapDbRowToSegmentReference(result.rows[0]);
    }

    async getReferences(): Promise<SegmentReferenceResponseDto[]> {
        const references = await SegmentReference.findBySegmentId(this.id);
        return references.map(r => ({ id: r.id, reference: r.reference }));
    }
    static async findBySegmentId(segmentId: string): Promise<SegmentReference[]> {
        const query = 'SELECT * FROM segment_references WHERE segment_id = $1';
        const result = await pool.query(query, [segmentId]);
        return result.rows.map(this.mapDbRowToSegmentReference);
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

    private static mapDbRowToSegmentReference(row: SegmentReferenceDbRow): SegmentReference {
        return new SegmentReference(
            row.id,
            row.segment_id,
            row.reference,
            row.created_at,
            row.updated_at
        );
    }
} 