/// <reference path="../types/express/index.d.ts" />
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../utils/errorHandler';
import { ERROR_CODES } from '../constants/errorDefinations';
import { verifyToken } from '../utils/tokenUtils';


const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Token extraction failed: missing or invalid Authorization header', {
      authHeader,
    });
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn('Token extraction failed: token not provided after Bearer', {
      authHeader,
    });
    return null;
  }
  return token;
};



const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);
  if (!token) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED_ERROR.httpStatus, ERROR_CODES.UNAUTHORIZED_ERROR.code, ERROR_CODES.UNAUTHORIZED_ERROR.message, "Please Login to Continue"
    );
  }

  const secret =  process.env.JWT_ACCESS_SECRET ||  "";
  const result = verifyToken(token, secret);

  if(!result.success){
    if(result?.error?.code == ERROR_CODES.EXPIRED_TOKEN.code){
      throw new AppError(
        ERROR_CODES.ACCESS_TOKEN_EXPIRED.httpStatus, ERROR_CODES.ACCESS_TOKEN_EXPIRED.code, ERROR_CODES.ACCESS_TOKEN_EXPIRED.message, "Please Login to Continue"
      );
    }
    throw new AppError(
      result?.error?.httpStatus || ERROR_CODES.UNAUTHORIZED_ERROR.httpStatus,
      result?.error?.code || ERROR_CODES.UNAUTHORIZED_ERROR.code,
      result?.error?.message || 'Invalid or missing token',
      result?.error?.httpStatus == 500 ? "Something Went Wrong!" : "Please Login to Continue"
    );
  }
  req.user = result.data;
  next();
};

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);
  if (token) {
    const secret =  process.env.JWT_ACCESS_SECRET ||  "";
    const result = verifyToken(token, secret);
    if (result.success) {
      req.user = result?.data;
    }
  }

  next();
};

export const authMiddleware = {
  requireAuth,
  optionalAuth,
};