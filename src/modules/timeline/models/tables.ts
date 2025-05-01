export const timelineTables = [
  {
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
    },
  },
  {
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
    },
  },
  {
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
  },
  {
    name: 'timeline_forks',
    sql: `
        CREATE TABLE IF NOT EXISTS timeline_forks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          original_timeline_id UUID NOT NULL REFERENCES timelines(id),
          forked_timeline_id UUID NOT NULL REFERENCES timelines(id),
          forked_by_id UUID NOT NULL REFERENCES users(id),
          forked_version TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
  },

] as const;



// INSERT INTO time_units (code, description) VALUES ('DAILY', 'Each Day'), ('WEEK', 'Each Week'), ('MONTHLY', 'Each Month');
// INSERT INTO timeline_types (type, description) VALUES ('ROADMAP', 'Roadmap based Timeline'), ('PROJECT', 'Project based Timeline'), ('STUDY', 'Study based Timeline');
