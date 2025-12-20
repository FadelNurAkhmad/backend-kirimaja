/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProfileResponse } from './response/profile.response';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
    constructor(private prismaService: PrismaService) {}

    async findOne(id: number): Promise<ProfileResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                phoneNumber: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        // untuk mengubah objek JavaScript biasa (user dan objek respons akhir) menjadi instance dari Data Transfer Object (DTO)
        return plainToInstance(ProfileResponse, user, {
            excludeExtraneousValues: true, // Opsi ini memastikan bahwa hanya properti yang didefinisikan dengan decorator (@Expose()) di dalam DTO yang akan disertakan dalam output
        });
    }

    async update(
        id: number,
        updateProfileDto: UpdateProfileDto,
        avatarFileName?: string | null,
    ): Promise<ProfileResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        const updateData: any = {};

        if (updateProfileDto.name) {
            updateData.name = updateProfileDto.name;
        }

        if (updateProfileDto.email) {
            updateData.email = updateProfileDto.email;
        }

        if (updateProfileDto.phone_number) {
            updateData.phoneNumber = updateProfileDto.phone_number;
        }

        if (avatarFileName) {
            updateData.avatar = `/uploads/photos/${avatarFileName}`;
        }

        if (updateProfileDto.password) {
            updateData.password = await bcrypt.hash(
                updateProfileDto.password,
                10,
            );
        }

        const updatedUser = await this.prismaService.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                phoneNumber: true,
            },
        });

        // untuk mengubah objek JavaScript biasa (user dan objek respons akhir) menjadi instance dari Data Transfer Object (DTO)
        return plainToInstance(ProfileResponse, updatedUser, {
            excludeExtraneousValues: true, // Opsi ini memastikan bahwa hanya properti yang didefinisikan dengan decorator (@Expose()) di dalam DTO yang akan disertakan dalam output
        });
    }
}
