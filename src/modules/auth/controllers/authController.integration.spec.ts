import request from 'supertest';
import app from '../../../app';
import { testDb } from '../../../__test__/helpers/dbHelper';
import bcrypt from 'bcryptjs';

// Set flag for integration tests
process.env.JEST_IS_INTEGRATION = 'true';

describe('Auth Controller Integration Tests', () => {
    // Test data
    const testUser = {
        fname: 'John',
        lname: 'Doe',
        username: 'johndoe',
        email: 'john.doe@test.com',
        password: 'Password123!@#'
    };

    beforeAll(async () => {
        // Ensure clean state
        await testDb.query('DELETE FROM users');
    });

    beforeEach(async () => {
        // Clean up before each test
        await testDb.query('DELETE FROM users');
    });

    afterAll(async () => {
        // Clean up
        await testDb.query('DELETE FROM users');
        // Note: We do NOT close the connection here because it's handled globally in setup.ts
    });

    describe('POST /api/auth/register', () => {
        it('should successfully register a new user and return 201', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fname: testUser.fname,
                    lname: testUser.lname,
                    username: testUser.username,
                    email: testUser.email,
                    password: testUser.password
                });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Registration successful');
            expect(response.body.data).toHaveProperty('userId');
            expect(response.body.data.userId).toBeTruthy();

            // Verify user was created in database
            const dbResult = await testDb.query('SELECT * FROM users WHERE email = $1', [testUser.email]);
            expect(dbResult.rows).toHaveLength(1);
            expect(dbResult.rows[0].email).toBe(testUser.email);
            expect(dbResult.rows[0].fname).toBe(testUser.fname);
            expect(dbResult.rows[0].lname).toBe(testUser.lname);
            expect(dbResult.rows[0].username).toBe(testUser.username);

            // Verify password was hashed
            expect(dbResult.rows[0].password).not.toBe(testUser.password);
            const isPasswordValid = await bcrypt.compare(testUser.password, dbResult.rows[0].password);
            expect(isPasswordValid).toBe(true);
        });

        it('should return 400 if required fields are missing', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: testUser.email,
                    password: testUser.password
                    // Missing fname, lname, username
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 if email is invalid format', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fname: testUser.fname,
                    lname: testUser.lname,
                    username: testUser.username,
                    email: 'invalid-email',
                    password: testUser.password
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 if password is too weak', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fname: testUser.fname,
                    lname: testUser.lname,
                    username: testUser.username,
                    email: testUser.email,
                    password: '123' // Too weak
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 409 if user with same email already exists', async () => {
            // Arrange - First register a user
            await request(app)
                .post('/api/auth/register')
                .send(testUser);

            // Act - Try to register again with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            // Assert
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Register a user before each login test
            await request(app)
                .post('/api/auth/register')
                .send(testUser);
        });

        it('should successfully login with valid credentials and set refresh token cookie', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Login Success');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data.accessToken).toBeTruthy();
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('email', testUser.email);
            expect(response.body.data.user).toHaveProperty('fname', testUser.fname);
            expect(response.body.data.user).not.toHaveProperty('password'); // Should not expose password

            // Verify refresh token cookie was set
            const cookies = response.headers['set-cookie'] as unknown as string[];
            expect(cookies).toBeDefined();
            expect(Array.isArray(cookies)).toBe(true);
            expect(cookies).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('refreshToken=')
                ])
            );

            // Verify cookie has correct attributes
            const refreshTokenCookie = cookies.find((cookie: string) => cookie.startsWith('refreshToken='));
            expect(refreshTokenCookie).toContain('HttpOnly');
            expect(refreshTokenCookie).toContain('SameSite=Strict');
        });

        it('should return 401 if email does not exist', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: testUser.password
                });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 401 if password is incorrect', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!'
                });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 if email is missing', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: testUser.password
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 if password is missing', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        let accessToken: string;

        beforeEach(async () => {
            // Register and login to get access token
            await request(app)
                .post('/api/auth/register')
                .send(testUser);

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            accessToken = loginResponse.body.data.accessToken;
        });

        it('should return logged-in user details with valid access token', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User fetched successfully');
            expect(response.body.data).toHaveProperty('email', testUser.email);
            expect(response.body.data).toHaveProperty('fname', testUser.fname);
            expect(response.body.data).toHaveProperty('lname', testUser.lname);
            expect(response.body.data).toHaveProperty('username', testUser.username);
            expect(response.body.data).not.toHaveProperty('password'); // Should not expose password
        });

        it('should return 401 if no access token is provided', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/me');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 if access token is invalid', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token-here');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 if access token is expired', async () => {
            // Note: This test would require generating an expired token
            // For now, we'll just test with a malformed token
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImV4cCI6MTUxNjIzOTAyMn0.invalid';

            // Act
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${expiredToken}`);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/refresh', () => {
        let refreshToken: string;

        beforeEach(async () => {
            // Register and login to get refresh token
            await request(app)
                .post('/api/auth/register')
                .send(testUser);

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            // Extract refresh token from cookie
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
            const refreshTokenCookie = cookies?.find((cookie: string) => cookie.startsWith('refreshToken='));
            refreshToken = refreshTokenCookie?.split(';')[0].split('=')[1] || '';
        });

        it('should return new access token with valid refresh token', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data.accessToken).toBeTruthy();
            expect(response.body.data.accessToken).not.toBe(refreshToken); // Should be different
        });

        it('should return 401 if refresh token is not provided', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/refresh');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 if refresh token is invalid', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=invalid-refresh-token']);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Full Authentication Flow', () => {
        it('should complete full authentication workflow: register → login → access protected route → refresh → access again', async () => {
            // Step 1: Register
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(registerResponse.status).toBe(201);
            const userId = registerResponse.body.data.userId;

            // Step 2: Login
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(loginResponse.status).toBe(200);
            const accessToken1 = loginResponse.body.data.accessToken;
            const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
            const refreshTokenCookie = cookies?.find((cookie: string) => cookie.startsWith('refreshToken='));
            const refreshToken = refreshTokenCookie?.split(';')[0].split('=')[1] || '';

            // Step 3: Access protected route with access token
            const meResponse1 = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken1}`);

            expect(meResponse1.status).toBe(200);
            expect(meResponse1.body.data.id).toBe(userId);

            // Wait for 1.1 second to ensure new token has different iat/exp
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Step 4: Refresh access token
            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect(refreshResponse.status).toBe(200);
            const accessToken2 = refreshResponse.body.data.accessToken;
            expect(accessToken2).toBeTruthy();
            expect(accessToken2).not.toBe(accessToken1); // New token should be different

            // Step 5: Access protected route with new access token
            const meResponse2 = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken2}`);

            expect(meResponse2.status).toBe(200);
            expect(meResponse2.body.data.id).toBe(userId);
            expect(meResponse2.body.data.email).toBe(testUser.email);
        });
    });
});
