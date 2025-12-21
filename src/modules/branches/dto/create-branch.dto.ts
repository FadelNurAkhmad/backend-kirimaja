import { z, ZodObject } from 'zod';

const createBranchSchema = z.object({
    name: z
        .string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be string',
        })
        .min(1, 'Branch name must be least 1 character long'),
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
});

export class CreateBranchDto {
    static schema: ZodObject<any> = createBranchSchema;

    constructor(
        public readonly name: string,
        public readonly address: string,
        public readonly phone_number: string,
    ) {}
}
