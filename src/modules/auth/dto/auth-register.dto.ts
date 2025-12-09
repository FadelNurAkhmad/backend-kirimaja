import { z, ZodObject } from 'zod';

const authRegisterSchema = z.object({
    name: z
        .string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be string',
        })
        .min(1, 'Name is required'),
    email: z
        .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be string',
        })
        .email({
            message: 'Invalid email format',
        }),
    password: z
        .string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be string',
        })
        .min(8, 'Password must be at least 8 characters long'),
    phone_number: z
        .string({
            required_error: 'Phone number is required',
            invalid_type_error: 'Phone number must be string',
        })
        .min(10, 'Password must be at least 10 characters long'),
});

export class AuthRegisterDto {
    static schema: ZodObject<any> = authRegisterSchema;

    constructor(
        public readonly name: string,
        public readonly email: string,
        public readonly password: string,
        public readonly phone_number: string,
    ) {}
}
