import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from './logger';
import { ErrorResponse, ErrorObject, ValidationErrorDetails } from '../types/responseTypes';
import { ERROR_CODES } from '../constants/errorDefinations';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public clientMessage:string,
    public details?: any // Temporary any, refined in middleware
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let response: ErrorResponse;
  if (err instanceof AppError) {
    err.statusCode = err.statusCode || ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus;
    const clientMessage = err.clientMessage || ERROR_CODES.INTERNAL_SERVER_ERROR.message;
    const errorObj: ErrorObject = {
      code: err.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR.code,
      message: err.message || ERROR_CODES.INTERNAL_SERVER_ERROR.message,
      details: err.details, // Could be ValidationErrorDetails or undefined
    };
    response = {
      success: false,
      message: clientMessage,
      error: errorObj,
    };
    return res.status(err.statusCode).json(response);
  }

  if (err instanceof z.ZodError) {
    const details: ValidationErrorDetails = err.errors.reduce((acc, e) => {
      acc[e.path.join('.')] = e.message;
      return acc;
    }, {} as ValidationErrorDetails);

    response = {
      success: false,
      message: 'Validation failed',
      error: {
        code: ERROR_CODES.VALIDATION_ERROR.code,
        message: ERROR_CODES.VALIDATION_ERROR.message,
        details,
      },
    };
    return res.status(ERROR_CODES.VALIDATION_ERROR.httpStatus).json(response);
  }

  // Unhandled errors
  logger.error(err.stack);
  response = {
    success: false,
    message: ERROR_CODES.INTERNAL_SERVER_ERROR.message,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR.code,
      message: ERROR_CODES.INTERNAL_SERVER_ERROR.message,
    },
  };
  res.status(ERROR_CODES.INTERNAL_SERVER_ERROR.httpStatus).json(response);
};