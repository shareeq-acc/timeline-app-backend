import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '../../../shared/utils/logger';
import { JwtPayload } from '../types/authTypes';
import { userService } from '../../user/services/userServices';
import { TokenResponseDto, TokenResponseDtoClient } from '../types/dtos';
import { UserPublicProps } from '../../user/models/User/usertypes';
import { ACCESS_TOKEN_AGE, REFRESH_TOKEN_AGE, SALT_ROUNDS } from '../constants/security';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';



export class AuthService {
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      logger.error('Error hashing password', { error });
      throw new Error();
    }
  }

  async login(email: string, password: string): Promise<TokenResponseDto> {
    const user = await userService.findUserByEmail(email);
    if (!user) {
      throw new AppError(ERROR_CODES.INVALID_CREDENTIALS.httpStatus, ERROR_CODES.INVALID_CREDENTIALS.code, ERROR_CODES.INVALID_CREDENTIALS.message, "Invalid Email or Password");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError(ERROR_CODES.INVALID_CREDENTIALS.httpStatus, ERROR_CODES.INVALID_CREDENTIALS.code, ERROR_CODES.INVALID_CREDENTIALS.message, "Invalid Email or Password");
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET

    if (!accessSecret || !refreshSecret) {
      logger.error('JWT_SECRET or JWT_REFRESH_SECRET is not defined');
      throw new Error();
    }
    const userResponse = await this.getUserById(user.id);
    const accessToken = jwt.sign({ id: user.id }, accessSecret, { expiresIn: ACCESS_TOKEN_AGE });
    const refreshToken = jwt.sign({ id: user.id }, refreshSecret, { expiresIn: REFRESH_TOKEN_AGE });
    logger.info('User logged in', { userId: user.id });

    return {
      accessToken,
      refreshToken,
      user:userResponse
    };
  }

  async register(
    fname: string,
    lname: string,
    username: string,
    email: string,
    password: string
  ): Promise<UserPublicProps> {
    const hashedPassword = await this.hashPassword(password);
    const user = await userService.createUser(fname, lname, username, email, hashedPassword);
    logger.info('User registered and logged in', { userId: user.id });
    return user;
  }


  async getUserById(userId: string): Promise<UserPublicProps> {
    if(!userId){
      throw new AppError(ERROR_CODES.UNAUTHORIZED_ERROR.httpStatus, ERROR_CODES.UNAUTHORIZED_ERROR.code, ERROR_CODES.UNAUTHORIZED_ERROR.message, "Please Login Again");
    }
    const user = await userService.getUserById(userId);
    if(!user){
      throw new AppError(ERROR_CODES.UNAUTHORIZED_ERROR.httpStatus, ERROR_CODES.UNAUTHORIZED_ERROR.code, ERROR_CODES.UNAUTHORIZED_ERROR.message, "Please Login Again");
    }
    return user;
  }

  verifyToken(token: string, secret: string): JwtPayload | null {
    try {
      if (!secret) {
        logger.error('JWT_SECRET is not defined');
        throw new Error('Server configuration error');
      }
      const decoded = jwt.verify(token, secret);
      if (typeof decoded === 'string' || !decoded || !('id' in decoded)) {
        logger.error('Invalid token payload', { decoded });
        return null;
      }
      return decoded as JwtPayload;
    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDtoClient> {
    if (!refreshToken || refreshToken == "") {
      throw new AppError(ERROR_CODES.UNAUTHORIZED_ERROR.httpStatus, ERROR_CODES.UNAUTHORIZED_ERROR.code, ERROR_CODES.UNAUTHORIZED_ERROR.message, "Please Login Again");
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      logger.error('JWT_REFRESH_SECRET is not defined');
      throw new Error('Server configuration error');
    }

    const payload = this.verifyToken(refreshToken, refreshSecret);
    if (!payload) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED_ERROR.httpStatus, ERROR_CODES.UNAUTHORIZED_ERROR.code, ERROR_CODES.UNAUTHORIZED_ERROR.message, "Please Login again");
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      logger.error('JWT_ACCESS_SECRET is not defined');
      throw new Error('Server configuration error');
    }

    const accessToken = jwt.sign({ id: payload.id }, accessSecret, { expiresIn: ACCESS_TOKEN_AGE });
    logger.info('Access token refreshed', { userId: payload.id });

    return { accessToken };
  }
}

export const authService = new AuthService();