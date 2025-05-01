import { Response } from 'express';
import { SuccessResponse } from '../types/responseTypes';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};
