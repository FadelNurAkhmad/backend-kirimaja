import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailJobData } from './processors/email-queue.processors';

export class QueueService {
    constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

    async addEmailJob(
        data: EmailJobData,
        options?: { delay?: number; attempts?: number },
    ) {
        return this.emailQueue.add('send-email', data, {
            delay: options?.delay,
            attempts: options?.attempts || 3,
            removeOnComplete: true,
            removeOnFail: false,
            backoff: {
                type: 'exponential',
                delay: options?.delay || 5000,
            },
        });
    }
}
