// interface for error details to ensure consistency
export interface ErrorDefinition {
    code: string;        // Custom error code (e.g., "DUPLICATE_EMAIL")
    httpStatus: number;  // HTTP status code (e.g., 409)
    message: string;     // Default error message (e.g., "Email already in use")
}

export type ErrorCode =
    | "BAD_REQUEST"
    | "VALIDATION_ERROR"
    | "INVALID_CREDENTIALS"
    | "UNAUTHORIZED_ERROR"
    | "EXPIRED_TOKEN"
    | "ACCESS_TOKEN_EXPIRED"
    | "REFRESH_TOKEN_EXPIRED"
    | "FORBIDDEN_ERROR"
    | "NOT_FOUND"
    | "CONFLICT_ERROR"
    | "DUPLICATE_EMAIL"
    | "EXPIRED_LINK"
    | "INTERNAL_SERVER_ERROR";

export const ERROR_CODES: Record<ErrorCode, ErrorDefinition> = {
    BAD_REQUEST: {
        code: "BAD_REQUEST",
        httpStatus: 400,
        message: "Bad Request",
    },
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        httpStatus: 400,
        message: "Input validation failed",
    },
    INVALID_CREDENTIALS: {
        code: "INVALID_CREDENTIALS",
        httpStatus: 401,
        message: "Invalid Credentials provided",
    },
    ACCESS_TOKEN_EXPIRED:{
        code:"ACCESS_TOKEN_EXPIRED",
        httpStatus:401,
        message:"Access token expired"
    },
    REFRESH_TOKEN_EXPIRED:{
        code:"REFRESH_TOKEN_EXPIRED",
        httpStatus:401,
        message:"Refresh token expired"
    },
    UNAUTHORIZED_ERROR: {
        code: "UNAUTHORIZED_ERROR",
        httpStatus: 401,
        message: "Invalid or unauthorized user",
    },
    EXPIRED_TOKEN: {
        code: "EXPIRED_TOKEN",
        httpStatus: 403,
        message: "token expired",
    },
    FORBIDDEN_ERROR: {
        code: "FORBIDDEN_ERROR",
        httpStatus: 403,
        message: "Content is Private",
    },
    NOT_FOUND: {
        code: "NOT_FOUND",
        httpStatus: 404,
        message: "Content not Found",
    },
    CONFLICT_ERROR: {
        code: "CONFLICT_ERROR",
        httpStatus: 409,
        message: "Content already exists",
    },
    DUPLICATE_EMAIL: {
        code: "DUPLICATE_EMAIL",
        httpStatus: 409,
        message: "Email already in use",
    },
    EXPIRED_LINK: {
        code: " EXPIRED_LINK",
        httpStatus: 410,
        message: "Link has been expired",
    },
    
    INTERNAL_SERVER_ERROR: {
        code: "INTERNAL_SERVER_ERROR",
        httpStatus: 500,
        message: "An unexpected error occurred",
    },

} as const;

export const getErrorDefinition = (code: string): ErrorDefinition => {
    return ERROR_CODES[code as ErrorCode] ?? ERROR_CODES.INTERNAL_SERVER_ERROR;
};