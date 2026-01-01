import { PrismaService } from './../../common/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { UserAddress } from '@prisma/client';

@Injectable()
export class UserAddressesService {
    constructor(
        private prismaService: PrismaService,
        private openCageService: OpenCageService,
    ) {}

    private readonly UPLOAD_PATH = '/uploads/photos/';

    private generatePhotoPath(filename: string): string | null {
        return filename ? `${this.UPLOAD_PATH}${filename}` : null;
    }

    private async getCoordinatesFromAddress(
        address: string,
    ): Promise<{ lat: number; lng: number }> {
        return await this.openCageService.geocode(address);
    }

    async create(
        createUserAddressDto: CreateUserAddressDto,
        userId: number,
        photoFilename?: string | null,
    ): Promise<UserAddress> {
        const { lat, lng } = await this.getCoordinatesFromAddress(
            createUserAddressDto.address,
        );

        if (photoFilename) {
            createUserAddressDto.photo = this.generatePhotoPath(photoFilename);
        }

        return await this.prismaService.userAddress.create({
            data: {
                userId,
                address: createUserAddressDto.address,
                tag: createUserAddressDto.tag,
                label: createUserAddressDto.label,
                photo: createUserAddressDto.photo,
                latitude: lat,
                longitude: lng,
            },
        });
    }

    async findAll(userId: number): Promise<UserAddress[]> {
        return await this.prismaService.userAddress.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phoneNumber: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    async findOne(id: number): Promise<UserAddress> {
        const userAddress = await this.prismaService.userAddress.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phoneNumber: true,
                        avatar: true,
                    },
                },
            },
        });
        if (!userAddress) {
            throw new NotFoundException(`UserAddress with ID ${id} not found`);
        }
        return userAddress;
    }

    async update(
        id: number,
        updateUserAddressDto: UpdateUserAddressDto,
        photoFilename?: string | null,
    ): Promise<UserAddress> {
        const userAddress = await this.findOne(id);

        // tanda ! TypeScript akan mengizinkannya karena Anda menjamin nilainya bukan null/undefined.
        let newLattitude: number = userAddress.latitude!;
        let newLongitude: number = userAddress.longitude!;

        if (
            updateUserAddressDto.address &&
            updateUserAddressDto.address !== userAddress.address
        ) {
            const coordinates = await this.getCoordinatesFromAddress(
                updateUserAddressDto.address,
            );
            newLattitude = coordinates.lat;
            newLongitude = coordinates.lng;
        }

        if (photoFilename) {
            updateUserAddressDto.photo = this.generatePhotoPath(photoFilename);
        }

        return await this.prismaService.userAddress.update({
            where: { id },
            data: {
                address: updateUserAddressDto.address ?? userAddress.address,
                tag: updateUserAddressDto.tag ?? userAddress.tag,
                label: updateUserAddressDto.label ?? userAddress.label,
                photo: updateUserAddressDto.photo ?? userAddress.photo,
                latitude: newLattitude,
                longitude: newLongitude,
            },
        });
    }

    async remove(id: number): Promise<void> {
        await this.findOne(id); // Ensure the address exists

        await this.prismaService.userAddress.delete({
            where: { id },
        });
    }
}
