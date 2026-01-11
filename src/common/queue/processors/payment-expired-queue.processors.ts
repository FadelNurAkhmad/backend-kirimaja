/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Job } from 'bull';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';

export interface PaymentExpiredJobData {
    paymentId: number;
    shipmentId: number;
    externalId: string;
}

@Processor('payment-expired-queue')
@Injectable()
export class PaymentExpiredQueueProcessors {
    private readonly logger = new Logger(PaymentExpiredQueueProcessors.name);
    // You can inject services here if needed
    constructor(private readonly prismaService: PrismaService) {}

    @Process('expire-payment')
    async handleExpirePayment(job: Job<PaymentExpiredJobData>) {
        const { data } = job;
        this.logger.log(
            `Processing payment expiration for payment ID: ${data.paymentId}`,
        );

        try {
            const payment = await this.prismaService.payment.findUnique({
                where: { id: data.paymentId },
                include: {
                    shipment: {
                        include: {
                            shipmentDetails: {
                                include: {
                                    user: {
                                        select: { email: true, name: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            // If payment not found or already processed, log and exit
            if (!payment) {
                this.logger.warn(
                    `Payment with ID ${data.paymentId} not found.`,
                );
                return;
            }

            // Only process if payment is still pending
            if (payment.status !== PaymentStatus.PENDING) {
                this.logger.log(
                    `Payment with ID ${data.paymentId} is not pending. Current status: ${payment.status}`,
                );
                return;
            }

            // Update payment and shipment status within a transaction
            await this.prismaService.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: data.paymentId },
                    data: { status: PaymentStatus.EXPIRED },
                });

                await tx.shipment.update({
                    where: { id: data.shipmentId },
                    data: { paymentStatus: PaymentStatus.EXPIRED },
                });

                await tx.shipmentHistory.create({
                    data: {
                        shipmentId: data.shipmentId,
                        status: 'Payment Expired',
                        description: `Payment with external ID ${data.externalId} has expired.`,
                    },
                });

                this.logger.log(
                    `Payment with ID ${data.paymentId} marked as expired.`,
                );
            });
        } catch (error) {
            this.logger.error(
                `Failed to process payment expiration for payment ID: ${data.paymentId}`,
                error.stack,
            );
            throw error;
        }
    }
}
