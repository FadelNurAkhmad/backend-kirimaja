import { z, ZodObject } from 'zod';

const employeeBranchSchema = z.object({
    name: z
        .string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be string',
        })
        .min(1, 'Branch name must be least 1 character long'),
    email: z
        .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be string',
        })
        .email('Invalid email format'),
    address: z
        .string({
            required_error: 'address is required',
            invalid_type_error: 'address must be string',
        })
        .min(1, {
            message: 'Branch address must be least 1 character long',
        }),
    phone_number: z
        .string({
            required_error: 'Phone number is required',
            invalid_type_error: 'Phone number must be string',
        })
        .min(10, 'Password must be at least 10 characters long'),
    branch_id: z
        .number({
            required_error: 'Branch ID is required',
            invalid_type_error: 'Branch ID must be number',
        })
        .int('Branch ID must be a valid integer'),
    type: z
        .string({
            required_error: 'Type is required',
            invalid_type_error: 'Type must be string',
        })
        .min(1, 'Type must be least 1 character long'),
    role_id: z
        .number({
            required_error: 'Role ID is required',
            invalid_type_error: 'Role ID must be number',
        })
        .int('Role ID must be a valid integer'),
    password: z
        .string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be string',
        })
        .min(6, 'Password must be at least 6 characters long'),
    avatar: z.string().optional().nullable(),
});

export class CreateEmployeeBranchDto {
    static schema: ZodObject<any> = employeeBranchSchema;

    constructor(
        public name: string,
        public email: string,
        public address: string,
        public phone_number: string,
        public branch_id: number,
        public type: string,
        public role_id: number,
        public password: string,
        public avatar?: string | null,
    ) {}
}
