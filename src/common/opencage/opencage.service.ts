/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenCageService {
    async geocode(address: string): Promise<{ lat: number; lng: number }> {
        const apiKey = process.env.OPENCAGE_API_KEY;
        if (!apiKey) {
            throw new Error(
                'OpenCage API key is not set in environment variables',
            );
        }
        try {
            const response = await axios.get(
                'https://api.opencagedata.com/geocode/v1/json',
                {
                    params: {
                        q: address,
                        key: apiKey,
                        limit: 1,
                    },
                },
            );
            const result = response.data.results?.[0];
            if (!result) {
                throw new Error('No results found for the given address');
            }
            return {
                lat: result.geometry.lat,
                lng: result.geometry.lng,
            };
        } catch (error) {
            console.error('Error during geocoding:', error);
            throw new BadRequestException('Failed to geocode the address');
        }
    }
}
