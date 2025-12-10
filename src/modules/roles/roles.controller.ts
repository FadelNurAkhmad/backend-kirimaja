import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { RoleResponse } from '../auth/response/auth-login.response';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Get()
    async findAll(): Promise<BaseResponse<RoleResponse[]>> {
        return {
            message: 'Role retrieved successfully',
            data: await this.rolesService.findAll(),
        };
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return this.rolesService.update(+id, updateRoleDto);
    }
}
