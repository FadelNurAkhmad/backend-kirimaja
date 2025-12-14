/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PermissionsService } from './../../permissions/permissions.service';
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        // Reflector digunakan untuk membaca metadata (izin) yang dilampirkan oleh dekorator.
        private reflector: Reflector,
        // PermissionsService adalah layanan (service) yang akan berinteraksi dengan database
        // untuk mengecek izin pengguna.
        private permissionService: PermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Mengambil izin yang diperlukan yang diatur pada handler (metode) atau class (kontroler).
        // Reflector mencari kunci 'permissions' (PERMISSIONS_KEY).
        const requiredPermissions = this.reflector.getAllAndOverride(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Jika tidak ada dekorator izin yang diterapkan pada Route ini, izinkan akses (true).
        if (!requiredPermissions) {
            return true;
        }

        const request = context.switchToHttp().getRequest(); // Mendapatkan objek request Express/Fastify
        // Asumsi middleware autentikasi (misalnya JwtAuthGuard) telah berjalan
        // dan melampirkan objek pengguna ke request.
        const user = request.user;
        // JwtAuthGuard (secara default mekanisme Passport NestJS) melampirkan objek yang dikembalikan oleh validate() di JwtStrategy ke objek request.

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Handle different permission requirement types
        // Cek jika metadata berupa objek, artinya dekorator 'Any' atau 'All' eksplisit digunakan.
        if (
            typeof requiredPermissions == 'object' &&
            requiredPermissions.type
        ) {
            const { type, permissions } = requiredPermissions;

            let hasPermission = false;

            if (type == 'any') {
                // Panggil service untuk cek apakah pengguna memiliki SALAH SATU dari izin yang diminta.
                hasPermission =
                    await this.permissionService.userHasAnyPermission(
                        user.id,
                        permissions,
                    );
            } else if (type == 'all') {
                // Panggil service untuk cek apakah pengguna memiliki SEMUA izin yang diminta.
                hasPermission =
                    await this.permissionService.userHasAllPermission(
                        user.id,
                        permissions,
                    );
            }

            if (!hasPermission) {
                throw new ForbiddenException(
                    `Access denied, required permissions: ${permissions.join(', ')}`,
                );
            }
        } else {
            // handle simple array of permission default to 'all' logic
            // Jika metadata hanya berupa Array string (dari RequiredPermissions default),
            // asumsikan logika 'ALL'.
            const permissions = Array.isArray(requiredPermissions)
                ? requiredPermissions
                : [requiredPermissions]; // Pastikan selalu berupa Array.

            // Panggil service untuk cek apakah pengguna memiliki SEMUA izin (default 'all').
            const hasPermission =
                await this.permissionService.userHasAllPermission(
                    user.id,
                    permissions,
                );
            if (!hasPermission) {
                throw new ForbiddenException(
                    `Access denied, required permissions: ${permissions.join(', ')}`,
                );
            }
        }

        // Jika semua pengecekan berhasil, izinkan akses ke Route (true).
        return true;
    }
}
