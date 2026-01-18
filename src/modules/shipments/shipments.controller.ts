/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Res,
    Req,
} from '@nestjs/common';
import { Response } from 'express';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/logged-in.guard';
import { RequiredPermissions } from '../auth/decorators/permissions.decorator';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { Shipment } from '@prisma/client';

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
    constructor(private readonly shipmentsService: ShipmentsService) {}

    @Post()
    @RequiredPermissions('shipments.create')
    async create(
        @Body() createShipmentDto: CreateShipmentDto,
    ): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentsService.create(createShipmentDto),
            message: 'Shipment created successfully',
        };
    }

    // user?: any adalah cara Anda memberi tahu TypeScript bahwa ada properti user.
    //Isi datanya berasal dari hasil decode Token JWT yang disuntikkan oleh middleware authentication sebelum masuk ke Controller.
    @Get()
    async findAll(
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<Shipment[]>> {
        return {
            data: await this.shipmentsService.findAll(req.user.id),
            message: 'Shipments retrieved successfully',
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentsService.findOne(+id),
            message: 'Shipment retrieved successfully',
        };
    }

    @Get(':id/pdf')
    async getShipmentPdf(
        @Param('id') id: string,
        @Res() res: Response,
    ): Promise<void> {
        const pdfBuffer = await this.shipmentsService.generateShipmentPdf(+id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=shipment_${id}.pdf`,
        });
        res.send(pdfBuffer);
    }

    @Get('tracking/:trackingNumber')
    async findShipmentByTrackingNumber(
        @Param('trackingNumber') trackingNumber: string,
    ): Promise<BaseResponse<Shipment>> {
        return {
            data: await this.shipmentsService.findShipmentByTrackingNumber(
                trackingNumber,
            ),
            message: 'Shipment retrieved successfully',
        };
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateShipmentDto: UpdateShipmentDto,
    ) {
        return this.shipmentsService.update(+id, updateShipmentDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.shipmentsService.remove(+id);
    }
}
