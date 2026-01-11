/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { QueueService } from 'src/common/queue/queue.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { XenditService } from 'src/common/xendit/xendit.service';
import { Shipment } from '@prisma/client';
import { getDistance } from 'geolib';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';

@Injectable()
export class ShipmentsService {
    constructor(
        private prismaService: PrismaService,
        private queueService: QueueService,
        private openCageService: OpenCageService,
        private xenditService: XenditService,
    ) {}

    async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
        const { lat, lng } = await this.openCageService.geocode(
            createShipmentDto.destination_address,
        );

        const userAddress = await this.prismaService.userAddress.findFirst({
            where: { id: createShipmentDto.pickup_address_id },
            include: { user: true },
        });

        if (!userAddress || !userAddress.latitude || !userAddress.longitude) {
            throw new NotFoundException('Pickup address not found');
        }

        const distance = getDistance(
            {
                latitude: userAddress.latitude,
                longitude: userAddress.longitude,
            },
            { latitude: lat, longitude: lng },
        );

        const distanceInKm = Math.ceil(distance / 1000); // Convert to kilometers

        const shipmentCost = this.calculateShippingCost(
            createShipmentDto.weight,
            distanceInKm,
            createShipmentDto.delivery_type,
        );

        const shipment = await this.prismaService.$transaction(
            async (prisma) => {
                const newShipment = await prisma.shipment.create({
                    data: {
                        paymentStatus: PaymentStatus.PENDING,
                        distance: distanceInKm,
                        price: shipmentCost.totalPrice,
                    },
                });

                await prisma.shipmentDetail.create({
                    data: {
                        shipmentId: newShipment.id,
                        pickupAddressId: createShipmentDto.pickup_address_id,
                        destinationAddress:
                            createShipmentDto.destination_address,
                        recipientName: createShipmentDto.recipient_name,
                        recipientPhone: createShipmentDto.recipient_phone,
                        weight: createShipmentDto.weight,
                        packageType: createShipmentDto.package_type,
                        deliveryType: createShipmentDto.delivery_type,
                        destinationLatitude: lat,
                        destinationLongitude: lng,
                        basePrice: shipmentCost.basePrice,
                        weightPrice: shipmentCost.weightPrice,
                        distancePrice: shipmentCost.distancePrice,
                        userId: userAddress.userId,
                    },
                });
                return newShipment;
            },
        );

        const invoice = await this.xenditService.createInvoice({
            externalId: `INV-${Date.now()}-${shipment.id}`,
            amount: shipmentCost.totalPrice,
            payerEmail: userAddress.user.email,
            description: `Shipment #${shipment.id} from ${userAddress.address} to ${createShipmentDto.destination_address}`,
            successRedirectUrl: `${process.env.FRONTEND_URL}/send-package/detail/${shipment.id}`,
            invoiceDuration: 10, // 10 seconds for testing
        });

        const payment = await this.prismaService.$transaction(
            // prisma (parameter): Terikat pada sesi transaksi yang sedang berjalan. Jika terjadi error, semua perintah melalui variabel ini akan di-rollback.
            async (prisma) => {
                // 1. Kirim data Payment ke antrean transaksi
                const createdPayment = await prisma.payment.create({
                    data: {
                        shipmentId: shipment.id,
                        externalId: invoice.external_id,
                        invoiceUrl: invoice.invoice_url,
                        invoiceId: invoice.id,
                        status: invoice.status,
                        expiryDate: invoice.expiry_date,
                    },
                });

                // 2. Kirim data ShipmentHistory ke antrean transaksi
                await prisma.shipmentHistory.create({
                    data: {
                        shipmentId: shipment.id,
                        status: PaymentStatus.PENDING,
                        description: `Shipment created, with total price Rp${shipmentCost.totalPrice}`,
                    },
                });

                // 3. Jika sampai sini tanpa error, SELESAI -> COMMIT ke Database
                return createdPayment;
            },
        );

        try {
            await this.queueService.addEmailJob({
                type: 'payment-notification',
                to: userAddress.user.email,
                shipmentId: shipment.id,
                amount: shipmentCost.totalPrice,
                paymentUrl: invoice.invoiceUrl,
                expiryDate: invoice.expiryDate,
            });
        } catch (error) {
            console.error('Failed to enqueue email job:', error);
        }

        try {
            await this.queueService.addPaymentExpiredJob(
                {
                    paymentId: payment.id,
                    shipmentId: shipment.id,
                    externalId: payment.externalId!, // Non-null assertion operator // tanda ! TypeScript akan mengizinkannya karena Anda menjamin nilainya bukan null/undefined.
                },
                invoice.expiryDate,
            );
        } catch (error) {
            console.error('Failed to enqueue payment expiry job:', error);
        }

        return shipment;
    }

    findAll() {
        return `This action returns all shipments`;
    }

    findOne(id: number) {
        return `This action returns a #${id} shipment`;
    }

    update(id: number, updateShipmentDto: UpdateShipmentDto) {
        return `This action updates a #${id} shipment`;
    }

    remove(id: number) {
        return `This action removes a #${id} shipment`;
    }

    private calculateShippingCost(
        weight: number,
        distance: number,
        deliveryType: string,
    ): {
        totalPrice: number;
        basePrice: number;
        weightPrice: number;
        distancePrice: number;
    } {
        const baseRates = {
            same_day: 15000,
            next_day: 10000,
            regular: 5000,
        };

        const weightRates = {
            same_day: 10000,
            next_day: 7000,
            regular: 3000,
        };

        const distanceTierRates = {
            same_day: {
                tier1: 5000,
                tier2: 8000,
                tier3: 12000,
            },
            next_day: {
                tier1: 3000,
                tier2: 5000,
                tier3: 8000,
            },
            regular: {
                tier1: 1000,
                tier2: 2000,
                tier3: 3000,
            },
        };

        const basePrice = baseRates[deliveryType] || baseRates['regular'];
        const weightRate = weightRates[deliveryType] || weightRates['regular'];
        const distanceRate =
            distanceTierRates[deliveryType] || distanceTierRates['regular'];

        const weightKg = Math.ceil(weight / 1000); // Convert grams to kilograms
        const weightPrice = weightKg * weightRate;

        let distancePrice = 0;
        if (distance <= 50) {
            distancePrice = distanceRate.tier1;
        } else if (distance <= 100) {
            distancePrice = distanceRate.tier1 + distanceRate.tier2;
        } else {
            const extraDistance = Math.ceil((distance - 100) / 100);
            distancePrice =
                distanceRate.tier3 + extraDistance * distanceRate.tier3;
        }

        const totalPrice = basePrice + weightPrice + distancePrice;
        const minimumPrice = 10000;
        const finalPrice = Math.max(totalPrice, minimumPrice); // Ensure minimum charge

        return {
            totalPrice: finalPrice,
            basePrice,
            weightPrice,
            distancePrice,
        };
    }
}
