/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
// Strategy	passport-jwt Logika autentikasi JWT murni (non-NestJS).
// Strategy adalah kelas inti yang berasal dari pustaka passport-jwt.
// Tugasnya adalah mendefinisikan logika autentikasi murni (misalnya, cara mengekstrak token, kunci rahasia yang digunakan, dan implementasi metode validate).
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET_KEY || 'secretKey',
        });
    }

    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
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
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
            role: user.role,
        };
    }
}
