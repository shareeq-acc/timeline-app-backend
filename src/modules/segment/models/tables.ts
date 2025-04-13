// modules/segments/tables.ts
export const segmentTables = [
  {
    name: 'segments',
    sql: `
      CREATE TABLE IF NOT EXISTS segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timeline_id UUID NOT NULL REFERENCES timelines(id),
        unit_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        topics TEXT[] NOT NULL,
        goals TEXT[] NOT NULL,
        "references" TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
] as const;