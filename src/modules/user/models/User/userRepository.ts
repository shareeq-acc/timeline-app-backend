import { pool } from "../../../../shared/config/db";
import logger from "../../../../shared/utils/logger";
import { UserType } from "./usertypes";
import { mapDbRowToUser } from "./userRepositoryDataMapper";

export class UserRepository {

  static async findOneByEmail(email: string): Promise<UserType | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    if(result.rows.length === 0) {
      return null;
    }
    return mapDbRowToUser(result.rows[0]);
  }

  static async findOneByUsername(username: string): Promise<UserType | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    if(result.rows.length === 0) {
      return null;
    }
    return mapDbRowToUser(result.rows[0]);
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
      RETURNING id, fname, lname, username, email, ai_usage, avatar, created_at, updated_at
    `;
    const result = await pool.query(query, [fname, lname, username, email, password]);
    logger.info('User created', { userId: result.rows[0].id });
    return mapDbRowToUser(result.rows[0]);
  }

  static async updateAiUsage(userId: string, newUsage: number): Promise<UserType | null> {
    try {
      const query = `
        UPDATE users 
        SET ai_usage = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, fname, lname, username, email, ai_usage, avatar, created_at, updated_at
      `;
      const result = await pool.query(query, [userId, newUsage]);
      return result.rows[0] ? mapDbRowToUser(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error updating ai_usage', { error, userId });
      return null;
    }
  }

  static async findById(id: string): Promise<UserType | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] ? mapDbRowToUser(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error in findById', { error });
      return null;
    }
  }

  static async updateProfile(userId: string, fname: string, lname: string): Promise<UserType | null> {
    try {
      const query = `
        UPDATE users 
        SET fname = $2, lname = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, fname, lname, username, email, ai_usage, avatar, created_at, updated_at
      `;
      const result = await pool.query(query, [userId, fname, lname]);
      return result.rows[0] ? mapDbRowToUser(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error updating profile name', { error, userId });
      return null;
    }
  }

  static async updateAvatar(userId: string, avatarUrl: string): Promise<UserType | null> {
    try {
      const query = `
        UPDATE users 
        SET avatar = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, fname, lname, username, email, ai_usage, avatar, created_at, updated_at
      `;
      const result = await pool.query(query, [userId, avatarUrl]);
      return result.rows[0] ? mapDbRowToUser(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error updating user avatar', { error, userId });
      return null;
    }
  }


} 