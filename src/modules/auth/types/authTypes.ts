// JWT Payload Type
export interface JwtPayload {
    id: string; 
    iat?: number; 
    exp?: number;
}
  
export interface AuthenticatedRequest {
    user: JwtPayload; // Attached by authMiddleware after JWT verification
}