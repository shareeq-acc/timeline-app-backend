export const segmentTables = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
    name: 'segment_scheduling',
    sql: `
      CREATE TABLE IF NOT EXISTS segment_scheduling (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      schedule_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(segment_id)
    );
    `,
    trigger: 
    `
      -- Create new updated function for segment_scheduling table
      CREATE OR REPLACE FUNCTION enforce_sequential_completion_new()
      RETURNS TRIGGER AS $$
      DECLARE
          segment_timeline_id UUID;
          segment_unit_number INTEGER;
      BEGIN
          -- First get the timeline_id and unit_number from the segments table
          -- for the segment being updated
          SELECT s.timeline_id, s.unit_number INTO segment_timeline_id, segment_unit_number
          FROM segments s
          WHERE s.id = NEW.segment_id;
          
          -- If we're marking a segment as completed
          IF NEW.completed_at IS NOT NULL THEN
              -- Check if the previous segment in the timeline is not yet completed
              IF EXISTS (
                  SELECT 1
                  FROM segments s
                  LEFT JOIN segment_scheduling ss ON s.id = ss.segment_id
                  WHERE s.timeline_id = segment_timeline_id
                  AND s.unit_number = segment_unit_number - 1
                  AND (ss.completed_at IS NULL OR ss.id IS NULL)
              ) THEN
                  RAISE EXCEPTION 'CLIENT_ERROR: Cannot complete segment at unit_number % until the previous segment is completed', segment_unit_number;
              END IF;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create the new trigger on segment_scheduling table
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_trigger
              WHERE tgname = 'check_sequential_completion_new'
              AND tgrelid = 'segment_scheduling'::regclass
          ) THEN
              CREATE TRIGGER check_sequential_completion_new
              BEFORE INSERT OR UPDATE ON segment_scheduling
              FOR EACH ROW
              WHEN (NEW.completed_at IS NOT NULL)
              EXECUTE FUNCTION enforce_sequential_completion_new();
          END IF;
      END $$;

    `,
  }
] as const;