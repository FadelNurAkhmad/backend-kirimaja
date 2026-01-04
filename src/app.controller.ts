import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/logged-in.guard';
import { PermissionGuard } from './modules/auth/decorators/permissions.guard';
import { RequiredAnyPermissions } from './modules/auth/decorators/permissions.decorator';
import { EmailService } from './common/email/email.service';
import { QueueService } from './common/queue/queue.service';

@Controller()
// @UseGuards(JwtAuthGuard, PermissionGuard)
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly emailService: EmailService,
        private readonly queueService: QueueService,
    ) {}

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

    @Get('send-email-test')
    async sendTestEmail(): Promise<string> {
        await this.queueService.addEmailJob({
            to: 'testing@gmail.com',
            type: 'testing',
        });
        return 'Test email sent';
    }
}
