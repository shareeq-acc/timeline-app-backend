import { Table } from "../../../../tables";

export const segmentSql : Table = {
    name: 'segments',
    sql: `
      CREATE TABLE IF NOT EXISTS segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
        unit_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        milestone TEXT DEFAULT NULL,
        is_fork_modified BOOLEAN DEFAULT FALSE,  
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(timeline_id, unit_number)
      )
    `,
}