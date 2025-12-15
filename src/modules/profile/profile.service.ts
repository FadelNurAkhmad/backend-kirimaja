import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProfileResponse } from './response/profile.response';
import { plainToInstance } from 'class-transformer';

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

    update(id: number, updateProfileDto: UpdateProfileDto) {
        return `This action updates a #${id} profile`;
    }
}
