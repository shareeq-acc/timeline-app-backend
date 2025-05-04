export const timelineForkSql = {
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
}