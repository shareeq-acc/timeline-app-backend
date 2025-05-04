import { Table } from "../../../../tables";

export const segmentGoalSql: Table = {
    name: 'segment_goals',
    sql: `
      CREATE TABLE IF NOT EXISTS segment_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
        goal TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
}