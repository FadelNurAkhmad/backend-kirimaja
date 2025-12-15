/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    Controller,
    Get,
    Body,
    Patch,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { ProfileResponse } from './response/profile.response';
import { JwtAuthGuard } from '../auth/guards/logged-in.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    async findOne(
        @Req() req: Request & { user?: any },
    ): Promise<BaseResponse<ProfileResponse>> {
        return {
            message: 'Profile retrieved successfully',
            data: await this.profileService.findOne(req.user.id),
        };
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.profileService.update(+id, updateProfileDto);
    }
}
