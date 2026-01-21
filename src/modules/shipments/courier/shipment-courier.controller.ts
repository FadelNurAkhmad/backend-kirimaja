/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/logged-in.guard';
import { ShipmentCourierService } from './shipment-courier.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { Shipment } from '@prisma/client';
import { PermissionGuard } from 'src/modules/auth/decorators/permissions.guard';
import { RequiredPermissions } from 'src/modules/auth/decorators/permissions.decorator';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('shipments/courier')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ShipmentCourierController {
    constructor(
        private readonly shipmentCourierService: ShipmentCourierService,
    ) {}

    @Get('list')
    @RequiredPermissions('delivery.read')
    async findAll(): Promise<BaseResponse<Shipment[]>> {
        return {
            data: await this.shipmentCourierService.findAll(),
            message: 'Shipments retrieved successfully',
        };
    }

    @Get('pick/:trackingNumber')
    @RequiredPermissions('delivery.update')
    async pickShipment(
        @Param('trackingNumber') trackingNumber: string,
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentCourierService.pickShipment(
                trackingNumber,
                req.user.id,
            ),
            message: 'Shipment picked up successfully',
        };
    }

    @Post('pickup/:trackingNumber')
    @RequiredPermissions('delivery.update')
    @UseInterceptors(
        // Configure file upload interceptor
        FileInterceptor('photo', {
            storage: diskStorage({
                // mengatur di mana dan bagaimana file tersebut disimpan di server (hard drive/disk).
                destination: './public/uploads/photos',
                // Kode ini membuat string unik gabungan dari waktu saat ini (Date.now()) dan angka acak besar.
                filename: (req, file, cb) => {
                    const uniqueSuffix =
                        Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, uniqueSuffix + extname(file.originalname));
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif|avif)$/)) {
                    return cb(
                        new Error('Only image files are allowed!'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async pickupShipment(
        @Param('trackingNumber') trackingNumber: string,
        @Req() req: Request & { user?: any },
        @UploadedFile() pickupProofImage: Express.Multer.File | undefined,
    ): Promise<BaseResponse<Shipment>> {
        if (!pickupProofImage) {
            throw new BadRequestException('Pickup proof image is required');
        }
        return {
            data: await this.shipmentCourierService.pickupShipment(
                trackingNumber,
                req.user.id,
                pickupProofImage.filename,
            ),
            message: 'Shipment pickup confirmed successfully',
        };
    }

    @Get('deliver-to-branch/:trackingNumber')
    @RequiredPermissions('delivery.update')
    async deliverToBranch(
        @Param('trackingNumber') trackingNumber: string,
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentCourierService.deliverToBranch(
                trackingNumber,
                req.user.id,
            ),
            message: 'Shipment delivered to branch successfully',
        };
    }

    @Get('pick-shipment-from-branch/:trackingNumber')
    @RequiredPermissions('delivery.update')
    async pickShipmentFromBranch(
        @Param('trackingNumber') trackingNumber: string,
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentCourierService.pickShipmentFromBranch(
                trackingNumber,
                req.user.id,
            ),
            message: 'Shipment picked from branch successfully',
        };
    }

    @Get('pickup-shipment-from-branch/:trackingNumber')
    @RequiredPermissions('delivery.update')
    async pickupShipmentFromBranch(
        @Param('trackingNumber') trackingNumber: string,
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentCourierService.pickupShipmentFromBranch(
                trackingNumber,
                req.user.id,
            ),
            message: 'Shipment picked up from branch successfully',
        };
    }

    @Post('deliver-to-customer/:trackingNumber')
    @RequiredPermissions('delivery.update')
    @UseInterceptors(
        // Configure file upload interceptor
        FileInterceptor('photo', {
            storage: diskStorage({
                // mengatur di mana dan bagaimana file tersebut disimpan di server (hard drive/disk).
                destination: './public/uploads/photos',
                // Kode ini membuat string unik gabungan dari waktu saat ini (Date.now()) dan angka acak besar.
                filename: (req, file, cb) => {
                    const uniqueSuffix =
                        Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, uniqueSuffix + extname(file.originalname));
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.originalname.match(/\.(jpg|jpeg|png|gif|avif)$/)) {
                    return cb(
                        new Error('Only image files are allowed!'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async deliverToCustomer(
        @Param('trackingNumber') trackingNumber: string,
        @Req() req: Request & { user?: any },
        @UploadedFile() receiptProofImage: Express.Multer.File | undefined,
    ): Promise<BaseResponse<Shipment>> {
        if (!receiptProofImage) {
            throw new BadRequestException('Receipt proof image is required');
        }
        return {
            data: await this.shipmentCourierService.deliverToCustomer(
                trackingNumber,
                req.user.id,
                receiptProofImage.filename,
            ),
            message: 'Shipment delivered to customer successfully',
        };
    }
}
