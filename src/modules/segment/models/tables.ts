import { Table } from "../../../tables";
import { segmentSql } from "./Segment/segmentSQL";
import { segmentGoalSql } from "./SegmentGoal/segmentGoalSQL";
import { segmentReferenceSql } from "./SegmentReference/segmentReferenceSQL";
import { segmentScheduleSql } from "./SegmentSchedule/segmentScheduleSQL";

export const segmentTables : Table[] = [
  segmentSql,
  segmentGoalSql,
  segmentReferenceSql,
  segmentScheduleSql,
]