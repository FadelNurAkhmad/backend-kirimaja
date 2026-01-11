import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { EmailService } from '../email/email.service';
import { EmailQueueProcessors } from './processors/email-queue.processors';
import { PaymentExpiredQueueProcessors } from './processors/payment-expired-queue.processors';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
            },
        }),
        BullModule.registerQueue(
            {
                name: 'email-queue',
            },
            {
                name: 'payment-expired-queue',
            },
        ),
    ],
    controllers: [],
    providers: [
        QueueService,
        EmailService,
        EmailQueueProcessors,
        PaymentExpiredQueueProcessors,
        PrismaService,
    ],
    exports: [QueueService],
})
export class QueueModule {}
