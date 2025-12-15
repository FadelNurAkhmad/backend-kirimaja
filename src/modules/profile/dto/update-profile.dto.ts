import { z, ZodObject } from 'zod';

const updateProfileSchema = z.object({
    name: z
        .string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be string',
        })
        .optional(),
    email: z
        .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be string',
        })
        .email({
            message: 'Invalid email format',
        })
        .optional(),
    password: z
        .string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be string',
        })
        .min(8, 'Password must be at least 8 characters long')
        .optional(),
    phone_number: z
        .string({
            required_error: 'Phone number is required',
            invalid_type_error: 'Phone number must be string',
        })
        .min(10, 'Password must be at least 10 characters long')
        .optional(),
    avatar: z
        .string({
            required_error: 'Avatar is required',
            invalid_type_error: 'Avatar must be a string',
        })
        .optional()
        .nullable(),
});

export class UpdateProfileDto {}
