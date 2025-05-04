import { Table } from "../../../tables";
import { timelineSql } from "./timeline/timelineSQL";
import { timelineForkSql } from "./timelineFork/timelineForkSQL";
import { timelineTypesSql } from "./timelineTypes/timelineTypeSQL";
import { timeUnitSql } from "./timeUnit/timeUnitSQL";

export const timelineTables : Table[] = [
  timelineTypesSql,
  timeUnitSql,
  timelineSql,
  timelineForkSql,
]