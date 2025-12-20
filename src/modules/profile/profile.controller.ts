/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    Controller,
    Get,
    Body,
    Patch,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { ProfileResponse } from './response/profile.response';
import { JwtAuthGuard } from '../auth/guards/logged-in.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';

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

    @Patch()
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: './public/uploads/photos',
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

    // multer adalah middleware Node.js yang dirancang khusus untuk menangani multipart/form-data, yang terutama digunakan untuk mengunggah file.

    // Baik Anda bekerja dengan Express.js murni atau kerangka kerja seperti NestJS (yang menggunakan Express.js secara default), Anda harus menginstal package ini agar fungsi diskStorage tersedia dan dapat digunakan.
    async update(
        @Req() req: Request & { user?: any },
        @Body() updateProfileDto: UpdateProfileDto,
        @UploadedFile() avatar: Express.Multer.File | undefined,
    ): Promise<BaseResponse<ProfileResponse>> {
        return {
            message: 'Profile updated successfully',
            data: await this.profileService.update(
                req.user.id,
                updateProfileDto,
                avatar ? avatar.filename : null,
            ),
        };
    }
}
