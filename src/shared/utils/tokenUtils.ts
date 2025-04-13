import jwt, { JwtPayload } from 'jsonwebtoken';
import { ERROR_CODES, ErrorDefinition } from '../constants/errorDefinations';

interface VerifyTokenResult {
  success: boolean;
  data?: string;
  error?: ErrorDefinition;
}

export const verifyToken = (token: string, secret: string): VerifyTokenResult => {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded) {
      return {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED_ERROR
      };
    }

    const verified = jwt.verify(token, secret) as JwtPayload;
    if (!verified || !verified.id) {
      return {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED_ERROR
      };
    }

    return {
      success: true,
      data: verified.id,
    };      

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: ERROR_CODES.EXPIRED_TOKEN
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED_ERROR
      };
    }

    return {
      success: false,
      error: ERROR_CODES.INTERNAL_SERVER_ERROR,
    };
  }
};