import { Table } from ".";
import { segmentTables } from "../modules/segment/models/tables";
import { timelineTables } from "../modules/timeline/models/tables";
import { userTables } from "../modules/user/models/tables";


export const allTables = [
  ...userTables,        // users first (no dependencies)
  ...timelineTables,    // timelines and timeline_forks next (depends on users)
  ...segmentTables,     // segments after that (depends on timelines)
] as Table[];

