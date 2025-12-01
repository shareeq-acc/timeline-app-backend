import { AuthService } from './authServices';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userService } from '../../user/services/userServices';
import logger from '../../../shared/utils/logger';
import { AppError } from '../../../shared/utils/errorHandler';
import { ERROR_CODES } from '../../../shared/constants/errorDefinations';

// Mock all dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../user/services/userServices');
jest.mock('../../../shared/utils/logger');

describe('AuthService', () => {
    let authService: AuthService;

    // Mock data
    const mockUser = {
        id: 'user-123',
        fname: 'John',
        lname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: '$2a$10$hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockUserPublic = {
        id: 'user-123',
        fname: 'John',
        lname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockAccessToken = 'mock.access.token';
    const mockRefreshToken = 'mock.refresh.token';

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Reset environment variables
        process.env.JWT_ACCESS_SECRET = 'test-access-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

        // Create new instance for each test
        authService = new AuthService();
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.JWT_ACCESS_SECRET;
        delete process.env.JWT_REFRESH_SECRET;
    });

    describe('login', () => {
        it('should successfully login a user with valid credentials', async () => {
            // Arrange
            const email = 'john@example.com';
            const password = 'password123';

            (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (userService.getUserById as jest.Mock).mockResolvedValue(mockUserPublic);
            (jwt.sign as jest.Mock)
                .mockReturnValueOnce(mockAccessToken)
                .mockReturnValueOnce(mockRefreshToken);

            // Act
            const result = await authService.login(email, password);

            // Assert
            expect(userService.findUserByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
            expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id);
            expect(jwt.sign).toHaveBeenCalledTimes(2);
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id },
                'test-access-secret',
                { expiresIn: expect.any(String) }
            );
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id },
                'test-refresh-secret',
                { expiresIn: expect.any(String) }
            );
            expect(logger.info).toHaveBeenCalledWith('User logged in', { userId: mockUser.id });
            expect(result).toEqual({
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
                user: mockUserPublic
            });
        });

        it('should throw an error if user is not found', async () => {
            // Arrange
            const email = 'nonexistent@example.com';
            const password = 'password123';

            (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(authService.login(email, password)).rejects.toThrow(AppError);
            expect(userService.findUserByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('should throw an error if password does not match', async () => {
            // Arrange
            const email = 'john@example.com';
            const password = 'wrongpassword';

            (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Act & Assert
            await expect(authService.login(email, password)).rejects.toThrow(AppError);
            expect(userService.findUserByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should throw an error if JWT_ACCESS_SECRET is not defined', async () => {
            // Arrange
            delete process.env.JWT_ACCESS_SECRET;
            const email = 'john@example.com';
            const password = 'password123';

            (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            // Act & Assert
            await expect(authService.login(email, password)).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith('JWT_SECRET or JWT_REFRESH_SECRET is not defined');
        });

        it('should throw an error if JWT_REFRESH_SECRET is not defined', async () => {
            // Arrange
            delete process.env.JWT_REFRESH_SECRET;
            const email = 'john@example.com';
            const password = 'password123';

            (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            // Act & Assert
            await expect(authService.login(email, password)).rejects.toThrow();
            expect(logger.error).toHaveBeenCalledWith('JWT_SECRET or JWT_REFRESH_SECRET is not defined');
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            // Arrange
            const fname = 'John';
            const lname = 'Doe';
            const username = 'johndoe';
            const email = 'john@example.com';
            const password = 'password123';
            const hashedPassword = '$2a$10$hashedPassword';

            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (userService.createUser as jest.Mock).mockResolvedValue(mockUserPublic);

            // Act
            const result = await authService.register(fname, lname, username, email, password);

            // Assert
            expect(bcrypt.hash).toHaveBeenCalledWith(password, expect.any(Number));
            expect(userService.createUser).toHaveBeenCalledWith(
                fname,
                lname,
                username,
                email,
                hashedPassword
            );
            expect(logger.info).toHaveBeenCalledWith('User registered and logged in', {
                userId: mockUserPublic.id
            });
            expect(result).toEqual(mockUserPublic);
        });
    });

    describe('getUserById', () => {
        it('should successfully return user by id', async () => {
            // Arrange
            const userId = 'user-123';

            (userService.getUserById as jest.Mock).mockResolvedValue(mockUserPublic);

            // Act
            const result = await authService.getUserById(userId);

            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockUserPublic);
        });

        it('should throw an error if userId is not provided', async () => {
            // Arrange
            const userId = '';

            // Act & Assert
            await expect(authService.getUserById(userId)).rejects.toThrow(AppError);
            expect(userService.getUserById).not.toHaveBeenCalled();
        });

        it('should throw an error if user is not found', async () => {
            // Arrange
            const userId = 'nonexistent-user';

            (userService.getUserById as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(authService.getUserById(userId)).rejects.toThrow(AppError);
            expect(userService.getUserById).toHaveBeenCalledWith(userId);
        });
    });

    describe('verifyToken', () => {
        it('should successfully verify a valid token', () => {
            // Arrange
            const token = 'valid.token.here';
            const secret = 'test-secret';
            const mockPayload = { id: 'user-123' };

            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

            // Act
            const result = authService.verifyToken(token, secret);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(token, secret);
            expect(result).toEqual(mockPayload);
        });

        it('should return null if token verification fails', () => {
            // Arrange
            const token = 'invalid.token.here';
            const secret = 'test-secret';

            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            // Act
            const result = authService.verifyToken(token, secret);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(token, secret);
            expect(logger.error).toHaveBeenCalledWith('Token verification failed', {
                error: expect.any(Error)
            });
            expect(result).toBeNull();
        });

        it('should return null if secret is not provided', () => {
            // Arrange
            const token = 'valid.token.here';
            const secret = '';

            // Act
            const result = authService.verifyToken(token, secret);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith('JWT_SECRET is not defined');
            expect(logger.error).toHaveBeenCalledWith('Token verification failed', {
                error: expect.any(Error)
            });
        });

        it('should return null if decoded token is a string', () => {
            // Arrange
            const token = 'valid.token.here';
            const secret = 'test-secret';

            (jwt.verify as jest.Mock).mockReturnValue('string-payload');

            // Act
            const result = authService.verifyToken(token, secret);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(token, secret);
            expect(logger.error).toHaveBeenCalledWith('Invalid token payload', {
                decoded: 'string-payload'
            });
            expect(result).toBeNull();
        });

        it('should return null if decoded token does not have id', () => {
            // Arrange
            const token = 'valid.token.here';
            const secret = 'test-secret';
            const mockPayload = { userId: 'user-123' }; // Missing 'id' field

            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

            // Act
            const result = authService.verifyToken(token, secret);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(token, secret);
            expect(logger.error).toHaveBeenCalledWith('Invalid token payload', {
                decoded: mockPayload
            });
            expect(result).toBeNull();
        });
    });

    describe('refreshToken', () => {
        it('should successfully refresh access token with valid refresh token', async () => {
            // Arrange
            const refreshToken = 'valid.refresh.token';
            const mockPayload = { id: 'user-123' };

            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
            (jwt.sign as jest.Mock).mockReturnValue(mockAccessToken);

            // Act
            const result = await authService.refreshToken(refreshToken);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith(refreshToken, 'test-refresh-secret');
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockPayload.id },
                'test-access-secret',
                { expiresIn: expect.any(String) }
            );
            expect(logger.info).toHaveBeenCalledWith('Access token refreshed', {
                userId: mockPayload.id
            });
            expect(result).toEqual({ accessToken: mockAccessToken });
        });

        it('should throw an error if refresh token is empty', async () => {
            // Arrange
            const refreshToken = '';

            // Act & Assert
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(AppError);
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        it('should throw an error if refresh token is not provided', async () => {
            // Arrange
            const refreshToken = null as any;

            // Act & Assert
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(AppError);
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        it('should throw an error if JWT_REFRESH_SECRET is not defined', async () => {
            // Arrange
            delete process.env.JWT_REFRESH_SECRET;
            const refreshToken = 'valid.refresh.token';

            // Act & Assert
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
                'Server configuration error'
            );
            expect(logger.error).toHaveBeenCalledWith('JWT_REFRESH_SECRET is not defined');
        });

        it('should throw an error if refresh token verification fails', async () => {
            // Arrange
            const refreshToken = 'invalid.refresh.token';

            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            // Act & Assert
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(AppError);
            expect(logger.error).toHaveBeenCalledWith('Token verification failed', {
                error: expect.any(Error)
            });
        });

        it('should throw an error if JWT_ACCESS_SECRET is not defined', async () => {
            // Arrange
            delete process.env.JWT_ACCESS_SECRET;
            const refreshToken = 'valid.refresh.token';
            const mockPayload = { id: 'user-123' };

            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

            // Act & Assert
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
                'Server configuration error'
            );
            expect(logger.error).toHaveBeenCalledWith('JWT_ACCESS_SECRET is not defined');
        });
    });
});
