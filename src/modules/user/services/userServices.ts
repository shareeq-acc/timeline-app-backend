import logger from '../../../shared/utils/logger';
import { UserPublicProps, UserType } from '../models/User/usertypes';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';
import { UserRepository } from '../models/User/userRepository';
import { mapUserToUserResponse } from '../models/User/userRepositoryDataMapper';


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
  ): Promise<UserPublicProps> {
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
    const user = await UserRepository.create(fname, lname, username, email, password);
    logger.info('User created successfully', { userId: user.id, username });
    return mapUserToUserResponse(user);
  }

  /**
   * Finds a user by email
   * @param email User's email
   * @returns User or null if not found
   */
  async findUserByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await UserRepository.findOneByEmail(email);
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
      const user = await UserRepository.findOneByUsername(username);
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
    async updateCredits(userId: string, credits: number): Promise<UserPublicProps | null> {
      const userExist = await this.getUserById(userId);
      if(!userExist){
        throw new AppError(
          ERROR_CODES.NOT_FOUND.httpStatus,
          ERROR_CODES.NOT_FOUND.code,
          ERROR_CODES.NOT_FOUND.message,
          "User not found"
        )
      }
      const updatedUser = await UserRepository.updateCredits(userId, credits);
      if(!updatedUser){
        throw new AppError(
          ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus,
          ERROR_CODES.INTERNAL_SERVER_ERROR.code,
          ERROR_CODES.INTERNAL_SERVER_ERROR.message,
          "Failed to update credits"
        )
      }
      return mapUserToUserResponse(updatedUser)
    
    }

  async getUserById(id: string): Promise<UserPublicProps | null> {
    try {
      const user =  await UserRepository.findById(id);
      if(user){
        return mapUserToUserResponse(user);
      }
      return null;
    } catch (error) {
      logger.error('Error in getUserById service', { error });
      throw error;
    }
  }

}

export const userService = new UserService();