import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
    private readonly uploadsPath = 'public/uploads/qrcodes/';
    trackingNumber: any;

    constructor() {
        if (!existsSync(this.uploadsPath)) {
            mkdirSync(this.uploadsPath, { recursive: true });
        }
    }

    async generateQrCode(trackingNumber: string): Promise<string> {
        try {
            const fileName = `${this.trackingNumber}_${Date.now()}.png`;
            const filePath = `${this.uploadsPath}${fileName}`;

            await QRCode.toFile(filePath, trackingNumber);

            return `uploads/qrcodes/${fileName}`;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code' + trackingNumber);
        }
    }
}
