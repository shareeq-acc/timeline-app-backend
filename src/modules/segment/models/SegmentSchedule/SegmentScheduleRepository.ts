import { pool } from "../../../../shared/config/db";
import { CreateSchedulingDto } from "../../dtos/dtos";
import { SegmentSchedulingProps } from "./segmentSchedule.type";
import { mapDbRowToSegmentSchedule } from "./segmentScheduleDataMapper";

export class SegmentScheduleRepository {

  static async findBySegmentId(segmentId: string): Promise<SegmentSchedulingProps | null> {
    const query = `
      SELECT * FROM segment_schedules
      WHERE segment_id = $1
    `;
    const result = await pool.query(query, [segmentId]);
    if (result.rows.length === 0) {
      return null;
    }
    return mapDbRowToSegmentSchedule(result.rows[0]);
  }

  static async create(data: CreateSchedulingDto): Promise<SegmentSchedulingProps> {
    const query = `
      INSERT INTO segment_schedules
        (segment_id, schedule_date)
      VALUES
        ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [data.segmentId, data.scheduleDate]);
    return mapDbRowToSegmentSchedule(result.rows[0]);
  }

  static async update(segmentId: string, data: Partial<SegmentSchedulingProps>): Promise<SegmentSchedulingProps> {
    const fields = [];
    const values = [segmentId];
    let valueIndex = 2;

    if (data.scheduleDate !== undefined && data.scheduleDate != null) {
      fields.push(`schedule_date = $${valueIndex++}`);
      values.push(data.scheduleDate);
    }

    if (data.completedAt !== undefined && data.completedAt != null) {
      fields.push(`completed_at = $${valueIndex++}`);
      values.push(data.completedAt);
    }
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE segment_schedules
      SET ${fields.join(', ')}
      WHERE segment_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }


  static async updateScheduleDate(segmentId:string, scheduleDate: string): Promise<SegmentSchedulingProps> {

    // First check if schedule exists
    const existingSchedule = await this.findBySegmentId(segmentId);
    
    if (!existingSchedule) {
      // Create new schedule if it doesn't exist
      return await this.create({ segmentId, scheduleDate });
    }

    // Update existing schedule
    const query = `
      UPDATE segment_schedules
      SET schedule_date = $1, updated_at = CURRENT_TIMESTAMP
      WHERE segment_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [scheduleDate, segmentId]);
    return mapDbRowToSegmentSchedule(result.rows[0]);
  }

  static async markComplete(segmentId: string) : Promise<SegmentSchedulingProps> {
    const query = `
      UPDATE segment_schedules
      SET completed_at = CURRENT_TIMESTAMP
      WHERE segment_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [segmentId]);
    return mapDbRowToSegmentSchedule(result.rows[0]);
  }
}