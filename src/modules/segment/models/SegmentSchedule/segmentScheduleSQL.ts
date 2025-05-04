import { Table } from "../../../../tables";

export const segmentScheduleSql: Table = {
    name: 'segment_schedules',
    sql: `
      CREATE TABLE IF NOT EXISTS segment_schedules(
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
      -- Create new updated function for segment_schedules table
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
                  LEFT JOIN segment_schedules ss ON s.id = ss.segment_id
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

      -- Create the new trigger on segment_schedules table
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_trigger
              WHERE tgname = 'check_sequential_completion_new'
              AND tgrelid = 'segment_schedules'::regclass
          ) THEN
              CREATE TRIGGER check_sequential_completion_new
              BEFORE INSERT OR UPDATE ON segment_schedules
              FOR EACH ROW
              WHEN (NEW.completed_at IS NOT NULL)
              EXECUTE FUNCTION enforce_sequential_completion_new();
          END IF;
      END $$;

    `,
}