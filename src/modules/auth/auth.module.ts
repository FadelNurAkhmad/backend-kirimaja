/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule, // Pastikan ConfigModule tersedia

        // Gunakan registerAsync untuk memuat Secret secara aman
        JwtModule.registerAsync({
            // Daftarkan ConfigModule untuk diinject
            imports: [ConfigModule],

            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET_KEY');

                // Pemeriksaan Kritis: Hentikan aplikasi jika secret tidak ada
                if (!secret) {
                    throw new Error(
                        'JWT_SECRET_KEY is required and not defined in configuration.',
                    );
                }

                return {
                    global: true,
                    secret: secret, // Ambil nilai dari .env melalui ConfigService
                    signOptions: {
                        // Ambil expiry dari .env
                        expiresIn:
                            configService.get<string>('JWT_EXPIRES_IN') || '1h',
                    },
                } as JwtModuleOptions; // Digunakan untuk menghindari Type Error
            },

            inject: [ConfigService], // Inject ConfigService ke useFactory
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, PrismaService],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
