import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../schemas/booking.schema';
import { differenceInDays, addHours, isBefore, isAfter, parseISO } from 'date-fns';

@Injectable()
export class AvailabilityService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    ) { }

    /**
     * Check if an item is available for the given date range
     * @param itemId Item ID to check
     * @param startDate Start date of rental period
     * @param endDate End date of rental period
     * @returns true if available, false if conflicting bookings exist
     */
    async checkAvailability(
        itemId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<boolean> {
        const conflicts = await this.findConflictingBookings(itemId, startDate, endDate);
        return conflicts.length === 0;
    }

    /**
     * Find all bookings that conflict with the given date range
     * Includes 1-hour buffer time between bookings
     */
    async findConflictingBookings(
        itemId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<BookingDocument[]> {
        // Add 1-hour buffer before and after
        const bufferStart = addHours(startDate, -1);
        const bufferEnd = addHours(endDate, 1);

        // Find bookings that overlap with the requested period (including buffer)
        const conflictingBookings = await this.bookingModel.find({
            item: itemId,
            status: {
                $in: [
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                    BookingStatus.PAID,
                    BookingStatus.ACTIVE,
                ],
            },
            $or: [
                // Booking starts during requested period
                {
                    startDate: { $gte: bufferStart, $lte: bufferEnd },
                },
                // Booking ends during requested period
                {
                    endDate: { $gte: bufferStart, $lte: bufferEnd },
                },
                // Booking completely encompasses requested period
                {
                    startDate: { $lte: bufferStart },
                    endDate: { $gte: bufferEnd },
                },
            ],
        });

        return conflictingBookings;
    }

    /**
     * Get all booked date ranges for an item
     * Used for calendar display
     */
    async getBookedDates(itemId: string): Promise<Array<{ startDate: Date; endDate: Date }>> {
        const bookings = await this.bookingModel
            .find({
                item: itemId,
                status: {
                    $in: [
                        BookingStatus.PENDING,
                        BookingStatus.CONFIRMED,
                        BookingStatus.PAID,
                        BookingStatus.ACTIVE,
                    ],
                },
            })
            .select('startDate endDate')
            .sort({ startDate: 1 });

        return bookings.map((booking) => ({
            startDate: booking.startDate,
            endDate: booking.endDate,
        }));
    }

    /**
     * Calculate total days between two dates
     */
    calculateTotalDays(startDate: Date, endDate: Date): number {
        return differenceInDays(endDate, startDate) + 1; // +1 to include both start and end day
    }

    /**
     * Validate date range
     */
    validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
        const now = new Date();

        // Check if start date is in the past
        if (isBefore(startDate, now)) {
            return { valid: false, error: 'Start date cannot be in the past' };
        }

        // Check if end date is before start date
        if (isBefore(endDate, startDate)) {
            return { valid: false, error: 'End date must be after start date' };
        }

        // Check minimum rental period (1 day)
        const days = this.calculateTotalDays(startDate, endDate);
        if (days < 1) {
            return { valid: false, error: 'Minimum rental period is 1 day' };
        }

        return { valid: true };
    }
}
