/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    BadRequestException,
    Controller,
    Get,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/logged-in.guard';
import { ShipmentBranchService } from './shipment-branch.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { Shipment, ShipmentBranchLog } from '@prisma/client';
import { PermissionGuard } from 'src/modules/auth/decorators/permissions.guard';
import { RequiredPermissions } from 'src/modules/auth/decorators/permissions.decorator';

@Controller('shipments/branch')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ShipmentBranchController {
    constructor(
        private readonly shipmentBranchService: ShipmentBranchService,
    ) {}

    @Get('logs')
    @RequiredPermissions('delivery.read')
    async findAll(
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<ShipmentBranchLog[]>> {
        try {
            const user = req.user;
            const log = await this.shipmentBranchService.findAll(user);
            return {
                data: log,
                message: 'Shipment branch logs retrieved successfully',
            };
        } catch (error) {
            throw new BadRequestException(
                'Failed to retrieve shipment branch logs',
            );
        }
    }
}
