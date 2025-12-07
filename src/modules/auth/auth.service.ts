/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from './../../common/prisma/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import {
    AuthLoginResponse,
    UserResponse,
} from './response/auth-login.response';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';

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

        const { ...userWithoutPassword } = user;

        const transformedUser = {
            ...userWithoutPassword,
            role: {
                ...user.role,
                permission: user.role.rolePermissions.map((rolePermission) => ({
                    id: rolePermission.permission.id,
                    name: rolePermission.permission.name,
                    key: rolePermission.permission.key,
                    resource: rolePermission.permission.resource,
                })),
            },
        };

        const userResponse = plainToInstance(UserResponse, transformedUser, {
            excludeExtraneousValues: true,
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
