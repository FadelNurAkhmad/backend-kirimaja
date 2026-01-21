import {
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { Shipment } from '@prisma/client';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';
import { ShipmentStatus } from 'src/common/enum/shipment-status.enum';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShipmentCourierService {
    constructor(private prismaService: PrismaService) {}

    async findAll(): Promise<Shipment[]> {
        return this.prismaService.shipment.findMany({
            where: {
                paymentStatus: PaymentStatus.PAID,
                deliveryStatus: {
                    in: [
                        ShipmentStatus.READY_TO_PICKUP,
                        ShipmentStatus.WAITING_PICKUP,
                        ShipmentStatus.PICKED_UP,
                        ShipmentStatus.READY_TO_PICKUP_AT_BRANCH,
                        ShipmentStatus.READY_TO_DELIVER,
                        ShipmentStatus.ON_THE_WAY,
                        ShipmentStatus.ON_THE_WAY_TO_ADDRESS,
                        ShipmentStatus.DELIVERED,
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async pickShipment(
        trackingNumber: string,
        userId: number,
    ): Promise<Shipment> {
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException(
                `Shipment with tracking number ${trackingNumber} not found`,
            );
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId,
            },
            select: { branchId: true },
        });

        if (!userBranch) {
            throw new NotFoundException(
                `User with ID ${userId} is not assigned to any branch`,
            );
        }

        return this.prismaService.$transaction(async (prisma) => {
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    deliveryStatus: ShipmentStatus.WAITING_PICKUP,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: updatedShipment.id,
                    userId,
                    branchId: userBranch.branchId,
                    status: ShipmentStatus.WAITING_PICKUP,
                    description: `Shipment picked up by courier (User ID: ${userId})`,
                },
            });

            return updatedShipment;
        });
    }

    async pickupShipment(
        trackingNumber: string,
        userId: number,
        pickupProofImage: string,
    ): Promise<Shipment> {
        if (!pickupProofImage) {
            throw new UnprocessableEntityException(
                `Pickup proof image is required`,
            );
        }
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException(
                `Shipment with tracking number ${trackingNumber} not found`,
            );
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId,
            },
            select: { branchId: true },
        });

        if (!userBranch) {
            throw new NotFoundException(
                `User with ID ${userId} is not assigned to any branch`,
            );
        }

        return this.prismaService.$transaction(async (prisma) => {
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    deliveryStatus: ShipmentStatus.PICKED_UP,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: updatedShipment.id,
                    userId,
                    branchId: userBranch.branchId,
                    status: ShipmentStatus.PICKED_UP,
                    description: `Shipment picked up by courier (User ID: ${userId})`,
                },
            });

            await prisma.shipmentDetail.updateMany({
                where: { shipmentId: updatedShipment.id },
                data: {
                    pickupProof: `uploads/photos/${pickupProofImage}`,
                },
            });

            return updatedShipment;
        });
    }

    async deliverToBranch(
        trackingNumber: string,
        userId: number,
    ): Promise<Shipment> {
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException(
                `Shipment with tracking number ${trackingNumber} not found`,
            );
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId,
            },
            select: { branchId: true },
        });

        if (!userBranch) {
            throw new NotFoundException(
                `User with ID ${userId} is not assigned to any branch`,
            );
        }

        return this.prismaService.$transaction(async (prisma) => {
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    deliveryStatus: ShipmentStatus.IN_TRANSIT,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: updatedShipment.id,
                    userId,
                    branchId: userBranch.branchId,
                    status: ShipmentStatus.IN_TRANSIT,
                    description: `Shipment picked up by courier (User ID: ${userId})`,
                },
            });

            return updatedShipment;
        });
    }

    async pickShipmentFromBranch(
        trackingNumber: string,
        userId: number,
    ): Promise<Shipment> {
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException(
                `Shipment with tracking number ${trackingNumber} not found`,
            );
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId,
            },
            select: { branchId: true },
        });

        if (!userBranch) {
            throw new NotFoundException(
                `User with ID ${userId} is not assigned to any branch`,
            );
        }

        return this.prismaService.$transaction(async (prisma) => {
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    deliveryStatus: ShipmentStatus.READY_TO_DELIVER,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: updatedShipment.id,
                    userId,
                    branchId: userBranch.branchId,
                    status: ShipmentStatus.READY_TO_DELIVER,
                    description: `Shipment picked up by courier (User ID: ${userId})`,
                },
            });

            return updatedShipment;
        });
    }

    async pickupShipmentFromBranch(
        trackingNumber: string,
        userId: number,
    ): Promise<Shipment> {
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException(
                `Shipment with tracking number ${trackingNumber} not found`,
            );
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId,
            },
            select: { branchId: true },
        });

        if (!userBranch) {
            throw new NotFoundException(
                `User with ID ${userId} is not assigned to any branch`,
            );
        }

        return this.prismaService.$transaction(async (prisma) => {
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    deliveryStatus: ShipmentStatus.ON_THE_WAY_TO_ADDRESS,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: updatedShipment.id,
                    userId,
                    branchId: userBranch.branchId,
                    status: ShipmentStatus.ON_THE_WAY_TO_ADDRESS,
                    description: `Shipment picked up by courier (User ID: ${userId})`,
                },
            });

            return updatedShipment;
        });
    }

    async deliverToCustomer(
        trackingNumber: string,
        userId: number,
        receiptProofImage: string,
    ): Promise<Shipment> {
        if (!receiptProofImage) {
            throw new UnprocessableEntityException(
                `Receipt proof image is required`,
            );
        }
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: true,
                payments: true,
            },
        });

        if (!shipment) {
            throw new NotFoundException(
                `Shipment with tracking number ${trackingNumber} not found`,
            );
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId,
            },
            select: { branchId: true },
        });

        if (!userBranch) {
            throw new NotFoundException(
                `User with ID ${userId} is not assigned to any branch`,
            );
        }

        return this.prismaService.$transaction(async (prisma) => {
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                    deliveryStatus: ShipmentStatus.DELIVERED,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: updatedShipment.id,
                    userId,
                    branchId: userBranch.branchId,
                    status: ShipmentStatus.DELIVERED,
                    description: `Shipment picked up by courier (User ID: ${userId})`,
                },
            });

            await prisma.shipmentDetail.updateMany({
                where: { shipmentId: updatedShipment.id },
                data: {
                    receiptProof: `uploads/photos/${receiptProofImage}`,
                },
            });

            return updatedShipment;
        });
    }
}
