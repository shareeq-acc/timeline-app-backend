import { Table } from "../../../../tables";

export const segmentReferenceSql: Table = {
    name: 'segment_references',
    sql: `
      CREATE TABLE IF NOT EXISTS segment_references (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
        "reference" TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
}