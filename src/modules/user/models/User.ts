import { pool } from "../../../shared/config/db";
import logger from "../../../shared/utils/logger";
import { UserType } from "../types/types";


export class User {
  id: string;
  fname: string;
  lname: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: UserType) {
    this.id = data.id;
    this.fname = data.fname;
    this.lname = data.lname;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.createdAt = data.created_at.toISOString();
    this.updatedAt = data.updated_at.toISOString();
  }

  static async findOneByEmail(email: string): Promise<UserType | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length === 0 ? null : result.rows[0] as UserType;
  }

  static async findOneByUsername(username: string): Promise<UserType | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows.length === 0 ? null : result.rows[0] as UserType;
  }

  static async create(
    fname: string,
    lname: string,
    username: string,
    email: string,
    password: string,
  ): Promise<UserType> {
    logger.info(`Creating User: ${fname} ${lname}`)
    const query = `
      INSERT INTO users (fname, lname, username, email, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, fname, lname, username, email, credits, created_at, updated_at
    `;

    const result = await pool.query(query, [fname, lname, username, email, password]);
    logger.info('User created', { userId: result.rows[0].id });
    return result.rows[0] as UserType;
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error in findById', { error });
      return null;
    }
  }
} 