import { Shipment, ShipmentBranchLog, User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { UserRole } from 'src/common/enum/user-role.enum';
import { ShipmentStatus } from 'src/common/enum/shipment-status.enum';
import { ScanShipmentDto } from '../dto/scan-shipmnet.dto';

@Injectable()
export class ShipmentBranchService {
    constructor(private prismaService: PrismaService) {}

    async findAll(user: User): Promise<ShipmentBranchLog[]> {
        if (user.roleId === Number(UserRole.SUPER_ADMIN)) {
            return this.prismaService.shipmentBranchLog.findMany({
                include: {
                    shipment: { include: { shipmentDetails: true } },
                    branch: true,
                    user: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }

        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId: user.id,
            },
            include: {
                branch: true,
            },
        });

        if (!userBranch) {
            throw new NotFoundException('User branch not found');
        }

        return this.prismaService.shipmentBranchLog.findMany({
            where: {
                branchId: userBranch.branchId,
            },
            include: {
                shipment: { include: { shipmentDetails: true } },
                branch: true,
                user: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async scanShipment(
        scanData: ScanShipmentDto,
        userId: number,
    ): Promise<ShipmentBranchLog> {
        const userBranch = await this.prismaService.employeeBranch.findFirst({
            where: {
                userId: userId,
            },
            include: {
                branch: true,
            },
        });

        if (!userBranch) {
            throw new NotFoundException('User branch not found');
        }
        const shipment = await this.prismaService.shipment.findFirst({
            where: {
                trackingNumber: scanData.tracking_number,
            },
            include: {
                shipmentDetails: true,
                shipmentHistories: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!shipment) {
            throw new NotFoundException('Shipment not found');
        }

        await this.validateScanType(
            shipment,
            scanData.type,
            userBranch.branchId,
        );

        const newStatus = this.determineNewStatus(
            scanData.type,
            scanData.is_ready_to_pickup,
        );

        return await this.prismaService.$transaction(async (prisma) => {
            const branchLog = await prisma.shipmentBranchLog.create({
                data: {
                    shipmentId: shipment.id,
                    branchId: userBranch.branchId,
                    type: scanData.type,
                    description: this.getDefaultDescription(
                        scanData.type,
                        userBranch.branch.name,
                    ),
                    status: newStatus,
                    scannedByUserId: userId,
                    trackingNumber: shipment.trackingNumber || '',
                    scanTime: new Date(),
                },
                include: {
                    shipment: {
                        include: { shipmentDetails: true },
                    },
                    branch: true,
                    user: true,
                },
            });
            await prisma.shipment.update({
                where: {
                    id: shipment.id,
                },
                data: {
                    deliveryStatus: newStatus,
                },
            });

            await prisma.shipmentHistory.create({
                data: {
                    shipmentId: shipment.id,
                    status: newStatus,
                    description: this.getDefaultDescription(
                        scanData.type,
                        userBranch.branch.name,
                    ),
                    userId: userId,
                    branchId: userBranch.branchId,
                },
            });
            return branchLog;
        });
    }

    private async validateScanType(
        shipment: Shipment,
        scanType: 'IN' | 'OUT',
        branchId: number,
    ): Promise<void> {
        const validStatuses = [
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.ARRIVED_AT_BRANCH,
            ShipmentStatus.AT_BRANCH,
            ShipmentStatus.DEPARTED_FROM_BRANCH,
        ];

        if (
            !validStatuses.includes(shipment.deliveryStatus as ShipmentStatus)
        ) {
            throw new UnprocessableEntityException(
                `Shipment status must be one of: ${validStatuses.join(', ')}`,
            );
        }

        if (scanType == 'OUT') {
            const lastScan =
                await this.prismaService.shipmentBranchLog.findFirst({
                    where: {
                        trackingNumber: shipment.trackingNumber || undefined,
                        type: 'IN',
                        branchId: branchId,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });

            if (!lastScan) {
                throw new BadRequestException(
                    'No IN Scan found for this shipment  at this branch',
                );
            }
        }
    }

    private determineNewStatus(
        scanType: 'IN' | 'OUT',
        isReadyPickup: boolean,
    ): ShipmentStatus {
        if (scanType === 'IN' && !isReadyPickup) {
            return ShipmentStatus.ARRIVED_AT_BRANCH;
        } else if (scanType === 'OUT' && !isReadyPickup) {
            return ShipmentStatus.DEPARTED_FROM_BRANCH;
        } else {
            return ShipmentStatus.READY_TO_PICKUP_AT_BRANCH;
        }
    }

    private getDefaultDescription(
        scanType: 'IN' | 'OUT',
        branchName: string,
    ): string {
        return scanType === 'IN'
            ? `Shipment arrived at branch: ${branchName}`
            : `Shipment departed from branch: ${branchName}`;
    }
}
