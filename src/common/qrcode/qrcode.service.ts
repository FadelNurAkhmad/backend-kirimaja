import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import * as QRCode from 'qrcode';
import { Logger } from '@nestjs/common';

@Injectable()
export class QrCodeService {
    private readonly uploadsPath = 'public/uploads/qrcodes/';
    private readonly logger = new Logger('WebhookDebug');

    constructor() {
        if (!existsSync(this.uploadsPath)) {
            mkdirSync(this.uploadsPath, { recursive: true });
        }
    }

    // async generateQrCode(trackingNumber: string): Promise<string> {
    //     try {
    //         const fileName = `${trackingNumber}_${Date.now()}.png`;
    //         const filePath = `${this.uploadsPath}${fileName}`;

    //         await QRCode.toFile(filePath, trackingNumber);

    //         return `uploads/qrcodes/${fileName}`;
    //     } catch (error) {
    //         console.error('Error generating QR code:', error);
    //         throw new Error('Failed to generate QR code' + trackingNumber);
    //     }
    // }
    async generateQrCode(trackingNumber: string): Promise<string> {
        try {
            // PERBAIKAN: Gunakan trackingNumber (parameter), bukan this.trackingNumber
            const fileName = `${trackingNumber}_${Date.now()}.png`;
            const filePath = `${this.uploadsPath}${fileName}`;

            await QRCode.toFile(filePath, trackingNumber);

            return `uploads/qrcodes/${fileName}`;
        } catch (error) {
            this.logger.error('Gagal membuat file QR:', error);
            throw error; // Melempar error agar transaksi di service melakukan rollback
        }
    }
}
