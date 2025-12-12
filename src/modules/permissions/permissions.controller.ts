import { Controller, Get, Body, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/logged-in.guard';
import { Permission } from '@prisma/client';
import { BaseResponse } from 'src/common/interface/base-response.interface';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Get()
    async findAll(): Promise<BaseResponse<Permission[]>> {
        return {
            message: 'Permission retrieved successfully',
            data: await this.permissionsService.findAll(),
        };
    }
}
