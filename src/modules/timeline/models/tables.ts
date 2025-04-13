export const timelineTables = [
    {
      name: 'timelines',
      sql: `
        CREATE TABLE IF NOT EXISTS timelines (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL CHECK (type IN ('ROADMAP', 'PROJECT')),
          time_unit TEXT NOT NULL CHECK (time_unit IN ('DAILY', 'WEEKLY', 'MONTHLY')),
          duration INTEGER NOT NULL,
          author_id UUID NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          is_generated BOOLEAN NOT NULL,
          prompt TEXT,
          is_public BOOLEAN NOT NULL,
          is_forked BOOLEAN NOT NULL,
          fork_count INTEGER NOT NULL,
          original_timeline_id UUID REFERENCES timelines(id),
          version TEXT NOT NULL,
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
          forked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          modified_units INTEGER[] NOT NULL
        )
      `,
    },
] as const;