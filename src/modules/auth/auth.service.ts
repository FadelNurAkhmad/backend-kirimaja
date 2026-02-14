/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from './../../common/prisma/prisma.service';
import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import {
    AuthLoginResponse,
    UserResponse,
} from './response/auth-login.response';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { AuthRegisterDto } from './dto/auth-register.dto';

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
    ) {}

    async login(request: AuthLoginDto): Promise<AuthLoginResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { email: request.email },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
            request.password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
        };

        // const accessToken = this.jwtService.sign(payload, {
        //     secret: process.env.JWT_SECRET_KEY || 'secretKey',
        //     expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        // });
        const accessToken = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = user;

        const transformedUser = {
            ...userWithoutPassword,
            role: {
                ...user.role, // ...user.role: Menyalin semua properti dasar dari objek role lama (seperti id, name peran) ke objek peran yang baru.
                permissions: user.role.rolePermissions.map(
                    (rolePermission) => ({
                        id: rolePermission.permission.id,
                        name: rolePermission.permission.name,
                        key: rolePermission.permission.key,
                        resource: rolePermission.permission.resource,
                    }),
                ),
            },
        };

        // untuk mengubah objek JavaScript biasa (transformedUser dan objek respons akhir) menjadi instance dari Data Transfer Object (DTO)
        const userResponse = plainToInstance(UserResponse, transformedUser, {
            excludeExtraneousValues: true, // Opsi ini memastikan bahwa hanya properti yang didefinisikan dengan decorator (@Expose()) di dalam DTO yang akan disertakan dalam output
        });
        return plainToInstance(
            AuthLoginResponse,
            {
                accessToken,
                user: userResponse,
            },
            {
                excludeExtraneousValues: true,
            },
        );
    }

    async register(request: AuthRegisterDto): Promise<AuthLoginResponse> {
        const existingUser = await this.prismaService.user.findUnique({
            where: { email: request.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const role = await this.prismaService.role.findFirst({
            where: { key: 'customer' },
        });

        if (!role) {
            throw new NotFoundException('Role customer tidak ditemukan');
        }

        const hashedPassword = await bcrypt.hash(request.password, 10); // Angka 10 adalah salt rounds atau cost factor, yang menentukan seberapa kuat dan lambat hashing dilakukan

        const user = await this.prismaService.user.create({
            data: {
                name: request.name,
                email: request.email,
                password: hashedPassword,
                phoneNumber: request.phone_number,
                roleId: role.id,
            },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
        };

        const accessToken = this.jwtService.sign(payload);

        const { password, ...userWithoutPassword } = user;

        const transformedUser = {
            ...userWithoutPassword,
            role: {
                ...user.role, // ...user.role: Menyalin semua properti dasar dari objek role lama (seperti id, name peran) ke objek peran yang baru.
                permission: user.role.rolePermissions.map((rolePermission) => ({
                    id: rolePermission.permission.id,
                    name: rolePermission.permission.name,
                    key: rolePermission.permission.key,
                    resource: rolePermission.permission.resource,
                })),
            },
        };

        // untuk mengubah objek JavaScript biasa (transformedUser dan objek respons akhir) menjadi instance dari Data Transfer Object (DTO)
        const userResponse = plainToInstance(UserResponse, transformedUser, {
            excludeExtraneousValues: true, // Opsi ini memastikan bahwa hanya properti yang didefinisikan dengan decorator (@Expose()) di dalam DTO yang akan disertakan dalam output
        });
        return plainToInstance(
            AuthLoginResponse,
            {
                accessToken,
                user: userResponse,
            },
            {
                excludeExtraneousValues: true,
            },
        );
    }
}
