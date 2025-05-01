import { PoolClient } from "pg";
import { pool } from "../../../shared/config/db";
import { CreateSchedulingDto } from "../types/dtos";
import { SegmentSchedulingType } from "../types/segmentTypes";
import { map } from "zod";

export class SegmentScheduling {

  static mapDbRowToSegmentScheduling(row: any): SegmentSchedulingType {
    return {
      id: row.id,
      segmentId: row.segment_id,
      scheduleDate: row.schedule_date,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async findBySegmentId(segmentId: string): Promise<SegmentSchedulingType | null> {
    const query = `
      SELECT * FROM segment_scheduling
      WHERE segment_id = $1
    `;
    const result = await pool.query(query, [segmentId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapDbRowToSegmentScheduling(result.rows[0]);
  }

  static async create(data: CreateSchedulingDto): Promise<SegmentSchedulingType> {
    const query = `
      INSERT INTO segment_scheduling
        (segment_id, schedule_date)
      VALUES
        ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [data.segmentId, data.scheduleDate]);
    return this.mapDbRowToSegmentScheduling(result.rows[0]);
  }

  static async update(segmentId: string, data: Partial<SegmentSchedulingType>): Promise<SegmentSchedulingType> {
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
      UPDATE segment_scheduling
      SET ${fields.join(', ')}
      WHERE segment_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }


  static async updateScheduleDate(segmentId:string, scheduleDate: string): Promise<SegmentSchedulingType> {
    console.log("Updating schedule date for segment ID:", segmentId);
    console.log("New schedule date:", scheduleDate);

    // First check if schedule exists
    const existingSchedule = await this.findBySegmentId(segmentId);
    
    if (!existingSchedule) {
      // Create new schedule if it doesn't exist
      return await this.create({ segmentId, scheduleDate });
    }

    // Update existing schedule
    const query = `
      UPDATE segment_scheduling
      SET schedule_date = $1, updated_at = CURRENT_TIMESTAMP
      WHERE segment_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [scheduleDate, segmentId]);
    return this.mapDbRowToSegmentScheduling(result.rows[0]);
  }

  static async markComplete(segmentId: string) : Promise<SegmentSchedulingType> {
    const query = `
      UPDATE segment_scheduling
      SET completed_at = CURRENT_TIMESTAMP
      WHERE segment_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [segmentId]);
    return this.mapDbRowToSegmentScheduling(result.rows[0]);
  }
}