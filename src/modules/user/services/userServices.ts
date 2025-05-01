import { User } from '../models/User';
import logger from '../../../shared/utils/logger';
import { UserType } from '../types/types';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';


export class UserService {
  /**
   * Creates a new user with hashed password
   * @param fname First name
   * @param lname Last name
   * @param username Unique username
   * @param email Unique email
   * @param password Raw password to hash
   * @returns Created User or null if username/email already exists
   */
  async createUser(
    fname: string,
    lname: string,
    username: string,
    email: string,
    password: string,
  ): Promise<UserType> {
    const existingUserWithEmail = await userService.findUserByEmail(email);
    if (existingUserWithEmail) {
      logger.error("User with this Email Already Exists!");
      throw new AppError(ERROR_CODES.CONFLICT_ERROR.httpStatus, ERROR_CODES.CONFLICT_ERROR.code, ERROR_CODES.CONFLICT_ERROR.message, "User with this Email Already Exists")
    }
    const existingUserWithUsername = await userService.findUserByUsername(username);
    if (existingUserWithUsername) {
      logger.error("User with this Username Already Exists!");
      throw new AppError(ERROR_CODES.CONFLICT_ERROR.httpStatus, ERROR_CODES.CONFLICT_ERROR.code, ERROR_CODES.CONFLICT_ERROR.message, "User with this Username Already Exists")
    }
    const user = await User.create(fname, lname, username, email, password);
    logger.info('User created successfully', { userId: user.id, username });
    return user;
  }

  /**
   * Finds a user by email
   * @param email User's email
   * @returns User or null if not found
   */
  async findUserByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await User.findOneByEmail(email);
      return user;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw new Error('Failed to find user by email');
    }
  }

  /**
   * Finds a user by username
   * @param username User's username
   * @returns User or null if not found
   */
  async findUserByUsername(username: string): Promise<UserType | null> {
    try {
      const user = await User.findOneByUsername(username);
      return user;
    } catch (error) {
      logger.error('Error finding user by username', { error, username });
      throw new Error('Failed to find user by username');
    }
  }

  /**
   * Updates a user's credits
   * @param userId User's ID
   * @param credits New credits value
   * @returns Updated User or null if not found
   */
  //   async updateCredits(userId: string, credits: number): Promise<User | null> {
  //     try {
  //       const query = `
  //         UPDATE users
  //         SET credits = $1, updated_at = CURRENT_TIMESTAMP
  //         WHERE id = $2
  //         RETURNING id, fname, lname, username, email, password, occupation, credits, created_at, updated_at
  //       `;
  //       const result = await User.pool.query(query, [credits, userId]);
  //       if (result.rows.length === 0) {
  //         logger.warn('User not found for credits update', { userId });
  //         return null;
  //       }
  //       logger.info('User credits updated', { userId, credits });
  //       return result.rows[0] as User;
  //     } catch (error) {
  //       logger.error('Error updating user credits', { error, userId });
  //       throw new Error('Failed to update user credits');
  //     }
  //   }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      logger.error('Error in getUserById service', { error });
      throw error;
    }
  }

}

export const userService = new UserService();