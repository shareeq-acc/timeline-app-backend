import { Request, Response } from 'express';
import { LoginRequestDto, RegisterRequestDto, RegisterResponseDto, TokenResponseDtoClient } from '../types/dtos';
import { ApiResponse } from '../../../shared/types/responseTypes';
import { sendSuccess } from '../../../shared/utils/successHandler';
import { authService } from '../services/authServices';
import { REFRESH_TOKEN_COOKIE_AGE } from '../constants/security';

/**
   * Logs in an existing user
   * @route POST /api/auth/login
   * @param req Request body with email and password
   * @param res Response with accessToken or error
   */
export const login = async (
  req: Request<{}, ApiResponse<TokenResponseDtoClient>, LoginRequestDto>,
  res: Response<ApiResponse<TokenResponseDtoClient>>
) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken } = await authService.login(email, password);
    res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_COOKIE_AGE
  });
  sendSuccess(res, { accessToken }, 'Login Success'); 
};

/**
   * Registers a new user
   * @route POST /api/auth/register
   * @param req Request body with fname, lname, username, email, password
   * @param res Response with userId or error
*/
export const register = async (
  req: Request<{}, ApiResponse<RegisterResponseDto>, RegisterRequestDto>,
  res: Response<ApiResponse<RegisterResponseDto>>
) => {
  const { email, password, fname, lname, username } = req.body;
  const user = await authService.register(fname, lname, username, email, password);
  sendSuccess(res, {userId:user.id}, 'Registration successful', 201);
};

/**
 * Refreshes the access token using the refresh token from cookies
 * @route POST /api/auth/refresh
 * @param req Request with refresh token in cookies
 * @param res Response with new access token
 */
export const refreshToken = async (
  req: Request<{}, ApiResponse<TokenResponseDtoClient>>,
  res: Response<ApiResponse<TokenResponseDtoClient>>
) => {
  const refreshToken = req.cookies?.refreshToken || "";
  const { accessToken } = await authService.refreshToken(refreshToken);
  sendSuccess(res, { accessToken }, 'Token refreshed successfully');
};