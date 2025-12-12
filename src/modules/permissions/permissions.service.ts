import { Injectable } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class PermissionsService {
    constructor(private prismaService: PrismaService) {}

    async findAll(): Promise<Permission[]> {
        return await this.prismaService.permission.findMany();
    }

    async getUserPermissions(userId: number): Promise<string[]> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
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
            return [];
        }

        return (
            user.role?.rolePermissions.map(
                (rolePermission) => rolePermission.permission.key,
            ) || []
        );
    }

    async userHasAnyPermission(
        userId: number,
        permissions: string[],
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.some((permission) =>
            userPermissions.includes(permission),
        );
    }
    // permissions.some(...) adalah metode array di JavaScript (atau TypeScript) yang mengiterasi melalui setiap elemen di array permissions (izin yang diminta).
    // userHasAnyPermission: Fungsi ini mengembalikan true jika SATU SAJA izin yang diminta (dari array permissions) ditemukan dalam izin yang dimiliki pengguna.

    async userHasAllPermission(
        userId: number,
        permissions: string[],
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.every((permission) =>
            userPermissions.includes(permission),
        );
    }
    // permissions.every(...) adalah metode array yang mengiterasi melalui setiap elemen di array permissions (izin yang diminta).
    // userHasAllPermission: Fungsi ini mengembalikan true jika SEMUA izin yang diminta (dari array permissions) ditemukan dalam izin yang dimiliki pengguna.
}
