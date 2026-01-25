import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { QueueModule } from 'src/common/queue/queue.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { XenditService } from 'src/common/xendit/xendit.service';
import { ShipmentWebhookController } from './webhook/shipment-webhook.controller';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { PdfService } from 'src/common/pdf/pdf.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ShipmentCourierService } from './courier/shipment-courier.service';
import { ShipmentCourierController } from './courier/shipment-courier.controller';
import { ShipmentBranchService } from './branch/shipment-branch.service';
import { ShipmentBranchController } from './branch/shipment-branch.controller';

@Module({
    imports: [QueueModule],
    controllers: [
        ShipmentsController,
        ShipmentWebhookController,
        ShipmentCourierController,
        ShipmentBranchController,
    ],
    providers: [
        ShipmentsService,
        PrismaService,
        OpenCageService,
        XenditService,
        QrCodeService,
        PdfService,
        ShipmentCourierService,
        PermissionsService,
        ShipmentBranchService,
    ],
})
export class ShipmentsModule {}
