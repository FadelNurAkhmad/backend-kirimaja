/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentsService {
    create(createShipmentDto: CreateShipmentDto) {
        return 'This action adds a new shipment';
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
        const finalPrice = Math.max(totalPrice, minimumPrice);

        return {
            totalPrice: finalPrice,
            basePrice,
            weightPrice,
            distancePrice,
        };
    }
}
