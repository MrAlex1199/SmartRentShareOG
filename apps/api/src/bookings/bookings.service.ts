import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { AvailabilityService } from './services/availability.service';
import { parseISO } from 'date-fns';

@Injectable()
export class BookingsService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        private availabilityService: AvailabilityService,
    ) { }

    /**
     * Create a new booking request
     */
    async create(createBookingDto: CreateBookingDto, renterId: string, itemData: any) {
        const startDate = parseISO(createBookingDto.startDate);
        const endDate = parseISO(createBookingDto.endDate);

        // Validate date range
        const dateValidation = this.availabilityService.validateDateRange(startDate, endDate);
        if (!dateValidation.valid) {
            throw new BadRequestException(dateValidation.error);
        }

        // Check availability
        const isAvailable = await this.availabilityService.checkAvailability(
            createBookingDto.item,
            startDate,
            endDate,
        );

        if (!isAvailable) {
            throw new BadRequestException('Item is not available for the selected dates');
        }

        // Calculate pricing
        const totalDays = this.availabilityService.calculateTotalDays(startDate, endDate);
        const totalPrice = itemData.dailyPrice * totalDays;
        const deliveryFee = createBookingDto.deliveryMethod === 'delivery' ? itemData.deliveryFee || 0 : 0;

        // Create booking
        const booking = new this.bookingModel({
            item: createBookingDto.item,
            renter: renterId,
            owner: itemData.owner,
            startDate,
            endDate,
            totalDays,
            dailyPrice: itemData.dailyPrice,
            totalPrice,
            deposit: itemData.deposit,
            deliveryFee,
            deliveryMethod: createBookingDto.deliveryMethod,
            deliveryAddress: createBookingDto.deliveryAddress,
            pickupLocation: createBookingDto.pickupLocation,
            status: BookingStatus.PENDING,
            statusHistory: [
                {
                    status: BookingStatus.PENDING,
                    timestamp: new Date(),
                    note: 'Booking created',
                },
            ],
        });

        return booking.save();
    }

    /**
     * Get booking by ID
     */
    async findOne(id: string, userId: string) {
        const booking = await this.bookingModel
            .findById(id)
            .populate('item')
            .populate('renter', 'displayName pictureUrl')
            .populate('owner', 'displayName pictureUrl');

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // Check if user has access to this booking
        if (
            booking.renter.toString() !== userId &&
            booking.owner.toString() !== userId
        ) {
            throw new ForbiddenException('You do not have access to this booking');
        }

        return booking;
    }

    /**
     * Get all bookings for a user (as renter)
     */
    async findMyBookings(userId: string) {
        return this.bookingModel
            .find({ renter: userId })
            .populate('item')
            .populate('owner', 'displayName pictureUrl')
            .sort({ createdAt: -1 });
    }

    /**
     * Get all booking requests for a user (as owner)
     */
    async findMyRequests(userId: string) {
        return this.bookingModel
            .find({ owner: userId })
            .populate('item')
            .populate('renter', 'displayName pictureUrl')
            .sort({ createdAt: -1 });
    }

    /**
     * Update booking status
     */
    async updateStatus(
        id: string,
        updateStatusDto: UpdateBookingStatusDto,
        userId: string,
    ) {
        const booking = await this.bookingModel.findById(id);

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // Validate status transition
        const isValid = this.validateStatusTransition(
            booking.status,
            updateStatusDto.status as BookingStatus,
            userId,
            booking.owner.toString(),
            booking.renter.toString(),
        );

        if (!isValid.valid) {
            throw new BadRequestException(isValid.error);
        }

        // Update status
        booking.status = updateStatusDto.status as BookingStatus;
        booking.statusHistory.push({
            status: updateStatusDto.status as BookingStatus,
            timestamp: new Date(),
            note: updateStatusDto.note,
        });

        return booking.save();
    }

    /**
     * Cancel booking (by renter)
     */
    async cancel(id: string, userId: string) {
        const booking = await this.bookingModel.findById(id);

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.renter.toString() !== userId) {
            throw new ForbiddenException('Only the renter can cancel this booking');
        }

        if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
            throw new BadRequestException('Cannot cancel booking in current status');
        }

        booking.status = BookingStatus.CANCELLED;
        booking.statusHistory.push({
            status: BookingStatus.CANCELLED,
            timestamp: new Date(),
            note: 'Cancelled by renter',
        });

        return booking.save();
    }

    /**
     * Validate status transition
     */
    private validateStatusTransition(
        currentStatus: BookingStatus,
        newStatus: BookingStatus,
        userId: string,
        ownerId: string,
        renterId: string,
    ): { valid: boolean; error?: string } {
        // Define valid transitions
        const validTransitions: Record<BookingStatus, BookingStatus[]> = {
            [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
            [BookingStatus.CONFIRMED]: [BookingStatus.PAID, BookingStatus.CANCELLED],
            [BookingStatus.PAID]: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
            [BookingStatus.ACTIVE]: [BookingStatus.COMPLETED, BookingStatus.OVERDUE],
            [BookingStatus.COMPLETED]: [],
            [BookingStatus.CANCELLED]: [],
            [BookingStatus.REJECTED]: [],
            [BookingStatus.OVERDUE]: [BookingStatus.COMPLETED],
        };

        // Check if transition is valid
        if (!validTransitions[currentStatus].includes(newStatus)) {
            return {
                valid: false,
                error: `Cannot transition from ${currentStatus} to ${newStatus}`,
            };
        }

        // Check permissions
        if (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.REJECTED) {
            if (userId !== ownerId) {
                return { valid: false, error: 'Only the owner can confirm or reject bookings' };
            }
        }

        if (newStatus === BookingStatus.CANCELLED) {
            if (userId !== renterId) {
                return { valid: false, error: 'Only the renter can cancel bookings' };
            }
        }

        return { valid: true };
    }
}
