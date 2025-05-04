import { Table } from "../../../../tables";

export const timeUnitSql : Table = {
    name: 'time_units',
    sql: `
      CREATE TABLE IF NOT EXISTS time_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE,
        description TEXT,
        duration_in_seconds INTEGER, -- new field added
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    dummyData: {
        checkSql: `SELECT COUNT(*) FROM time_units;`,
        insertSql: `
        INSERT INTO time_units (code, description, duration_in_seconds)
        VALUES 
          ('DAILY', 'Each Day', 86400),         -- 24 hours * 60 minutes * 60 seconds
          ('WEEK', 'Each Week', 604800),         -- 7 days * 86400 seconds
          ('MONTHLY', 'Each Month', 2592000);    -- Approximate (30 days * 86400 seconds)
      `,
    }
}