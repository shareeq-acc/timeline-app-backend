export interface SuccessResponse<T = any> {
    success: true;
    message: string;
    data: T;
}

export interface ValidationErrorDetails {
    [field: string]: string; // e.g., { "title": "Title Cannot be Empty" }
  }

export interface ErrorObject {
    code: string; // e.g., "UNAUTHORIZED_ERROR", "VALIDATION_ERROR"
    message: string;
    details?: ValidationErrorDetails; // Optional, for validation errors
  }

export interface ErrorResponse {
    success: false;
    message: string; // message for the client e.g., "Please Login to Continue"
    error: ErrorObject;
}
  
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;