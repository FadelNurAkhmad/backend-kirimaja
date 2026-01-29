/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Shipment, User } from '@prisma/client';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';
import { UserRole } from 'src/common/enum/user-role.enum';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class HistoryService {
    constructor(private readonly prismaService: PrismaService) {}

    async findAll(user: User): Promise<Shipment[]> {
        if (user.roleId === +UserRole.SUPER_ADMIN) {
            return this.prismaService.shipment.findMany({
                where: {
                    paymentStatus: PaymentStatus.PAID,
                },
                include: {
                    shipmentDetails: {
                        include: {
                            user: true,
                            pickupAddress: true,
                        },
                    },
                    shipmentHistories: true,
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        return this.prismaService.shipment.findMany({
            where: {
                paymentStatus: PaymentStatus.PAID,
                shipmentHistories: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                shipmentDetails: {
                    include: {
                        user: true,
                        pickupAddress: true,
                    },
                },
                shipmentHistories: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number): Promise<Shipment> {
        const shipment = await this.prismaService.shipment.findUnique({
            where: { id },
            include: {
                shipmentDetails: {
                    include: {
                        user: true,
                        pickupAddress: true,
                    },
                },
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException('Shipment not found');
        }

        return shipment;
    }
}
