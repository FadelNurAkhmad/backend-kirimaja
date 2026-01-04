import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from 'src/common/email/email.service';

export interface EmailJobData {
    to: string;
    type: string;
}

@Processor('email-queue')
export class EmailQueueProcessors {
    private readonly logger = new Logger(EmailQueueProcessors.name);

    constructor(private readonly emailService: EmailService) {}

    @Process('send-email')
    async handleSendEmailJob(job: Job<EmailJobData>) {
        const { data } = job;
        this.logger.log(`Processing email job: ${data.type} to ${data.to}`);
        // Here you would typically call the EmailService to send the email

        try {
            switch (data.type) {
                case 'testing':
                    await this.emailService.testingEmail(data.to);
                    this.logger.log(
                        `Successfully sent testing email to ${data.to}`,
                    );
                    break;

                default:
                    this.logger.warn(`Unknown email type: ${data.type}`);
                    break;
            }
        } catch (error) {
            this.logger.error(
                `Failed to process email job: ${data.type} to ${data.to}`,
                error,
            );
            throw error;
        }
    }
}
