/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private tamplatesPath: string;

    // Initialize the transporter and template path
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        this.tamplatesPath = path.join('./src/common/email/templates');
    }

    // Load and compile Handlebars template
    private loadTemplate(templateName: string): string {
        const templatePath = path.join(
            this.tamplatesPath,
            `${templateName}.hbs`,
        );
        return require('fs').readFileSync(templatePath, 'utf-8');
    }

    private compileTemplate(templateName: string, data: any): string {
        const templateSource = this.loadTemplate(templateName);
        const template = require('handlebars').compile(templateSource);
        return template(data);
    }

    async testingEmail(to: string): Promise<void> {
        const templateData = { name: 'KirimAja User' };
        const htmlContent = this.compileTemplate('test-email', templateData);

        const mailOptions = {
            from: process.env.SMTP_EMAIL_SENDER || 'test@mail.com',
            to,
            subject: 'Test Email from KirimAja',
            html: htmlContent,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendEmailPaymentNotification(
        to: string,
        paymentUrl: string,
        shipmentId: number,
        amount: number,
        expiryDate: Date,
    ): Promise<void> {
        const templateData = {
            shipmentId,
            paymentUrl,
            amount: amount.toLocaleString('id-ID'),
            expiryDate: expiryDate.toDateString(),
        };
        const htmlContent = this.compileTemplate(
            'payment-notification',
            templateData,
        );

        const mailOptions = {
            from: process.env.SMTP_EMAIL_SENDER || '',
            to,
            subject: `Payment Notification for Your Shipment #${shipmentId}`,
            html: htmlContent,
        };
        await this.transporter.sendMail(mailOptions);
    }
}
