import { Table } from "../../../../tables";
export const timelineSql : Table = {
    name: 'timelines',
    sql: `
        CREATE TABLE IF NOT EXISTS timelines (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type_id UUID NOT NULL REFERENCES timeline_types(id),
          time_unit_id UUID REFERENCES time_units(id), -- NULL for non-time-based timelines
          duration INTEGER, -- NULL for non-time-based timelines
          author_id UUID NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          is_generated BOOLEAN NOT NULL DEFAULT false,
          is_public BOOLEAN NOT NULL,
          enable_scheduling BOOLEAN NOT NULL DEFAULT false,
          version TEXT NOT NULL DEFAULT '1.0.0',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
}