// Mock logger to avoid winston initialization in tests
jest.mock('../../../shared/utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

import { Request, Response, NextFunction } from 'express';
import { dataValidation } from './dataValidation';

describe('Data Validation Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRequest = {
            body: {},
        };
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
        mockNext = jest.fn();
    });

    describe('validateRegister', () => {
        describe('Valid Registration Data', () => {
            it('should pass validation with valid registration data', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john.doe@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).toHaveBeenCalled();
                expect(statusMock).not.toHaveBeenCalled();
            });

            it('should pass validation with minimum length names', () => {
                mockRequest.body = {
                    fname: 'Jo',
                    lname: 'Do',
                    username: 'jdo',
                    email: 'j.d@example.com',
                    password: 'Pass1234',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).toHaveBeenCalled();
                expect(statusMock).not.toHaveBeenCalled();
            });

            it('should pass validation with maximum length names', () => {
                mockRequest.body = {
                    fname: 'Johnathanjames',
                    lname: 'Doesmithwilson',
                    username: 'johnathandoesmithw',
                    email: 'johnathan@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).toHaveBeenCalled();
                expect(statusMock).not.toHaveBeenCalled();
            });
        });

        describe('First Name Validation', () => {
            it('should fail when fname is too short', () => {
                mockRequest.body = {
                    fname: 'J',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        success: false,
                        message: 'Validation failed',
                        error: expect.objectContaining({
                            code: 'VALIDATION_ERROR',
                            details: expect.objectContaining({
                                fname: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when fname is too long', () => {
                mockRequest.body = {
                    fname: 'JohnathanJamesWi',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                fname: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when fname contains numbers', () => {
                mockRequest.body = {
                    fname: 'John123',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                fname: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when fname contains special characters', () => {
                mockRequest.body = {
                    fname: 'John@Doe',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });

            it('should fail when fname is empty', () => {
                mockRequest.body = {
                    fname: '',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });
        });

        describe('Last Name Validation', () => {
            it('should fail when lname is too short', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'D',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                lname: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when lname is too long', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'DoesmithWilsonJr',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                lname: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when lname contains non-alphabetic characters', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe123',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                lname: expect.any(String),
                            }),
                        }),
                    })
                );
            });
        });

        describe('Username Validation', () => {
            it('should fail when username is too short', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'jd',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                username: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when username is too long', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johnathandoesmithwilsonjr',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                username: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when username is empty', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: '',
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });
        });

        describe('Email Validation', () => {
            it('should fail with invalid email format', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'invalid-email',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                email: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when email is missing @ symbol', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'johndoeexample.com',
                    password: 'Password123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });

            it('should pass with valid email formats', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@example.co.uk',
                    'user+tag@example.com',
                ];

                validEmails.forEach((email) => {
                    mockRequest.body = {
                        fname: 'John',
                        lname: 'Doe',
                        username: 'johndoe',
                        email,
                        password: 'Password123',
                    };

                    mockNext.mockClear();
                    statusMock.mockClear();

                    dataValidation.validateRegister(
                        mockRequest as Request,
                        mockResponse as Response,
                        mockNext
                    );

                    expect(mockNext).toHaveBeenCalled();
                    expect(statusMock).not.toHaveBeenCalled();
                });
            });
        });

        describe('Password Validation', () => {
            it('should fail when password is too short', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Pass1',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                password: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when password has no numbers', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'Password',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                password: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when password has no alphabets', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: '12345678',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                password: expect.any(String),
                            }),
                        }),
                    })
                );
            });

            it('should fail when password is empty', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: '',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });

            it('should pass with valid password containing letters and numbers', () => {
                mockRequest.body = {
                    fname: 'John',
                    lname: 'Doe',
                    username: 'johndoe',
                    email: 'john@example.com',
                    password: 'ValidPass123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).toHaveBeenCalled();
                expect(statusMock).not.toHaveBeenCalled();
            });
        });

        describe('Multiple Field Validation Errors', () => {
            it('should return errors for all invalid fields', () => {
                mockRequest.body = {
                    fname: 'J',
                    lname: 'D',
                    username: 'jd',
                    email: 'invalid-email',
                    password: '123',
                };

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                fname: expect.any(String),
                                lname: expect.any(String),
                                username: expect.any(String),
                                email: expect.any(String),
                                password: expect.any(String),
                            }),
                        }),
                    })
                );
            });
        });

        describe('Missing Fields', () => {
            it('should fail when required fields are missing', () => {
                mockRequest.body = {};

                dataValidation.validateRegister(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });
        });

    });

    describe('validateLogin', () => {
        describe('Valid Login Data', () => {
            it('should pass validation with valid login credentials', () => {
                mockRequest.body = {
                    email: 'john@example.com',
                    password: 'Password123',
                };

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).toHaveBeenCalled();
                expect(statusMock).not.toHaveBeenCalled();
            });

            it('should pass validation with any non-empty password', () => {
                mockRequest.body = {
                    email: 'user@example.com',
                    password: 'x',
                };

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).toHaveBeenCalled();
                expect(statusMock).not.toHaveBeenCalled();
            });
        });

        describe('Email Validation', () => {
            it('should fail with invalid email format', () => {
                mockRequest.body = {
                    email: 'invalid-email',
                    password: 'password123',
                };

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                email: expect.any(String),
                            }),
                        }),
                    })
                );
            });
        });

        describe('Password Validation', () => {
            it('should fail when password is empty', () => {
                mockRequest.body = {
                    email: 'john@example.com',
                    password: '',
                };

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
                expect(jsonMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        error: expect.objectContaining({
                            details: expect.objectContaining({
                                password: expect.any(String),
                            }),
                        }),
                    })
                );
            });
        });

        describe('Missing Fields', () => {
            it('should fail when email is missing', () => {
                mockRequest.body = {
                    password: 'password123',
                };

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });

            it('should fail when password is missing', () => {
                mockRequest.body = {
                    email: 'john@example.com',
                };

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });

            it('should fail when both fields are missing', () => {
                mockRequest.body = {};

                dataValidation.validateLogin(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext
                );

                expect(mockNext).not.toHaveBeenCalled();
                expect(statusMock).toHaveBeenCalledWith(400);
            });
        });
    });
});
