import { Table } from "../../../../tables";
import { DEFAULT_CREDITS } from "../../constants/userConstants";

export const userSql: Table = {
    name: 'users',
    sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          fname TEXT NOT NULL,
          lname TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          credits INTEGER NOT NULL DEFAULT ${DEFAULT_CREDITS},
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
}
