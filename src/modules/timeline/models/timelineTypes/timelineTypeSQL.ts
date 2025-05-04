import { Table } from "../../../../tables";

export const timelineTypesSql : Table = {
    name: 'timeline_types',
    sql: `
        CREATE TABLE IF NOT EXISTS timeline_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT UNIQUE NOT NULL,
          description TEXT,
          needs_time_unit BOOLEAN NOT NULL DEFAULT false,
          needs_duration BOOLEAN NOT NULL DEFAULT false,
          supports_scheduling BOOLEAN NOT NULL DEFAULT false,
          is_subscribable BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    dummyData: {
      checkSql: `SELECT COUNT(*) FROM timeline_types;`,
      insertSql: `
         INSERT INTO timeline_types (type, description, needs_time_unit, needs_duration, supports_scheduling, is_subscribable)
            VALUES 
              ('ROADMAP', 'Structured timeline based on fixed units (like days, weeks, months).', true, true, true, false),
              ('CHRONICLE', 'Free-form documentation timeline, recording events as they happen.', false, false, false, true);
        `,
    }
}