import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { AvailabilityService } from './services/availability.service';
import { LineNotifyService } from '../notifications/line-notify.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { parseISO, format } from 'date-fns';
import { th } from 'date-fns/locale';

@Injectable()
export class BookingsService {
    private readonly logger = new Logger(BookingsService.name);

    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        private availabilityService: AvailabilityService,
        private lineNotifyService: LineNotifyService,
        private notificationsService: NotificationsService,
        private auditService: AuditService,
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

        // Extract owner ID - item.owner may be a populated object or an ObjectId
        const ownerData: any = itemData.owner;
        const ownerId = ownerData?._id ? ownerData._id.toString() : ownerData?.toString();

        console.log('Creating booking with owner:', ownerId, 'renter:', renterId);

        // Create booking
        const booking = new this.bookingModel({
            item: createBookingDto.item,
            renter: renterId,
            owner: ownerId,
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

        const savedBooking = await booking.save();

        // Send LINE notification to owner
        try {
            const ownerUser = await this.bookingModel.db.model('User').findById(ownerId).select('lineId displayName');
            if (ownerUser?.lineId) {
                await this.lineNotifyService.notifyOwnerNewBooking(ownerUser.lineId, {
                    renterName: itemData.renterName || 'ผู้เช่า',
                    itemTitle: itemData.title,
                    startDate: format(startDate, 'd MMM yyyy', { locale: th }),
                    endDate: format(endDate, 'd MMM yyyy', { locale: th }),
                    totalDays,
                    totalPrice: totalPrice + deliveryFee,
                });
            }
        } catch (err) {
            this.logger.warn(`Failed to send LINE notification to owner: ${err}`);
        }

        // Send in-app notification to owner
        try {
            await this.notificationsService.notifyNewBooking(ownerId, {
                itemTitle: itemData.title,
                renterName: itemData.renterName || 'ผู้เช่า',
                bookingId: savedBooking._id.toString(),
            });
        } catch (err) {
            this.logger.warn(`Failed to send in-app notification to owner: ${err}`);
        }

        // Audit log
        await this.auditService.log({
            action: 'booking.created',
            actor: renterId,
            actorRole: 'student',
            targetId: savedBooking._id.toString(),
            targetType: 'Booking',
            metadata: {
                itemId: savedBooking.item?.toString(),
                totalPrice: savedBooking.totalPrice,
                totalDays: savedBooking.totalDays,
                startDate: savedBooking.startDate,
                endDate: savedBooking.endDate,
            },
        });

        return savedBooking;
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
        // Handle both populated objects and ObjectId references
        const renterData: any = booking.renter;
        const ownerData: any = booking.owner;

        console.log('Booking renter type:', typeof renterData);
        console.log('Booking renter:', renterData);
        console.log('Booking owner type:', typeof ownerData);
        console.log('Booking owner:', ownerData);
        console.log('User ID:', userId);

        const renterId = renterData?._id ? renterData._id.toString() : renterData?.toString();
        const ownerId = ownerData?._id ? ownerData._id.toString() : ownerData?.toString();

        console.log('Renter ID:', renterId);
        console.log('Owner ID:', ownerId);
        console.log('Match renter?', renterId === userId);
        console.log('Match owner?', ownerId === userId);

        if (renterId !== userId && ownerId !== userId) {
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
        // First try direct owner field match
        const directMatch = await this.bookingModel
            .find({ owner: userId })
            .populate('item')
            .populate('renter', 'displayName pictureUrl')
            .sort({ createdAt: -1 });

        // Also find bookings where item belongs to this user (handles legacy data)
        const allBookings = await this.bookingModel
            .find({})
            .populate('item')
            .populate('renter', 'displayName pictureUrl')
            .sort({ createdAt: -1 });

        // Filter bookings where item.owner matches userId
        const itemOwnerMatch = allBookings.filter((booking) => {
            const item: any = booking.item;
            if (!item) return false;
            const itemOwnerId = item.owner?._id ? item.owner._id.toString() : item.owner?.toString();
            return itemOwnerId === userId;
        });

        // Merge and deduplicate by booking ID
        const seen = new Set<string>();
        const merged = [...directMatch, ...itemOwnerMatch].filter((b) => {
            const id = b._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        // Fix any bookings with wrong owner field while we're at it
        for (const booking of itemOwnerMatch) {
            const ownerField: any = booking.owner;
            const currentOwnerId = ownerField?._id ? ownerField._id.toString() : ownerField?.toString();
            if (currentOwnerId !== userId) {
                // Fix the owner field
                await this.bookingModel.findByIdAndUpdate(booking._id, { owner: userId });
                console.log(`Fixed booking ${booking._id} owner field`);
            }
        }

        return merged.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
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

        const updatedBooking = await booking.save();

        // Send LINE + in-app notifications based on new status
        try {
            const fullBooking = await this.bookingModel
                .findById(id)
                .populate('item', 'title')
                .populate('renter', 'lineId displayName')
                .populate('owner', 'lineId displayName');

            const renter: any = fullBooking?.renter;
            const owner: any = fullBooking?.owner;
            const item: any = fullBooking?.item;
            const renterId = renter?._id?.toString() || updatedBooking.renter.toString();
            const ownerId2 = owner?._id?.toString() || updatedBooking.owner.toString();
            const itemTitle = item?.title || 'สินค้า';

            if (updateStatusDto.status === BookingStatus.CONFIRMED) {
                // LINE
                if (renter?.lineId) {
                    await this.lineNotifyService.notifyRenterBookingConfirmed(renter.lineId, {
                        itemTitle,
                        startDate: format(new Date(updatedBooking.startDate), 'd MMM yyyy', { locale: th }),
                        endDate: format(new Date(updatedBooking.endDate), 'd MMM yyyy', { locale: th }),
                        ownerName: owner?.displayName || 'เจ้าของ',
                        bookingId: id,
                    });
                }
                // In-app
                await this.notificationsService.notifyBookingConfirmed(renterId, {
                    itemTitle,
                    ownerName: owner?.displayName || 'เจ้าของ',
                    bookingId: id,
                });
            } else if (updateStatusDto.status === BookingStatus.REJECTED) {
                // LINE
                if (renter?.lineId) {
                    await this.lineNotifyService.notifyRenterBookingRejected(renter.lineId, {
                        itemTitle,
                        reason: updateStatusDto.note,
                    });
                }
                // In-app
                await this.notificationsService.notifyBookingRejected(renterId, {
                    itemTitle,
                    reason: updateStatusDto.note,
                    bookingId: id,
                });
            } else if (updateStatusDto.status === BookingStatus.CANCELLED) {
                // LINE
                if (owner?.lineId) {
                    await this.lineNotifyService.notifyOwnerBookingCancelled(owner.lineId, {
                        renterName: renter?.displayName || 'ผู้เช่า',
                        itemTitle,
                        startDate: format(new Date(updatedBooking.startDate), 'd MMM yyyy', { locale: th }),
                    });
                }
                // In-app
                await this.notificationsService.notifyBookingCancelled(ownerId2, {
                    itemTitle,
                    renterName: renter?.displayName || 'ผู้เช่า',
                    bookingId: id,
                });
            }
        } catch (err) {
            this.logger.warn(`Failed to send notifications: ${err}`);
        }

        return updatedBooking;
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
