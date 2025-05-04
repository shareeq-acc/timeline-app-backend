export const jwtConfig = {
  secret: process.env.JWT_SECRET as string, // Secret for access tokens
  refreshSecret: process.env.JWT_REFRESH_SECRET as string, // Separate secret for refresh tokens
  accessTokenExpiresIn: '1h', // Access token expiration 
  refreshTokenExpiresIn: '7d', // Refresh token expiration 
};