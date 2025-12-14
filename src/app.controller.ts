import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/logged-in.guard';
import { PermissionGuard } from './modules/auth/decorators/permissions.guard';
import { RequiredAnyPermissions } from './modules/auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    // Rute ini tidak memiliki dekorator izin spesifik (@Required...),
    // sehingga PermissionGuard akan mengizinkannya (selama pengguna terautentikasi).
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('protected')
    // Menerapkan dekorator izin kustom.
    // Pengguna harus memiliki SALAH SATU dari izin yang terdaftar di sini (saat ini hanya satu).
    @RequiredAnyPermissions('shipments.create')
    getProtectedResource(): string {
        return 'This is a protected resource';
    }
}
