import { z } from 'zod';
import { validateBody } from '../../../shared/utils/validation';

const registerSchema = z.object({
  fname: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(15, 'First name must be 15 characters or fewer')
    .regex(/^[a-zA-Z]+$/, 'First name must contain only alphabets')
    .nonempty('Please Enter Last First Name'),
  lname: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(15, 'Last name must be 15 characters or fewer')
    .regex(/^[a-zA-Z]+$/, 'Last name must contain only alphabets')
    .nonempty('Please Enter Last Name'), 
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or fewer')
    .nonempty('Please Enter Last username'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[a-zA-Z]/, 'Password must contain at least 1 alphabet')
    .nonempty('Please Enter a Password'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});


export const dataValidation = {
  validateRegister: validateBody(registerSchema),
  validateLogin: validateBody(loginSchema)
};