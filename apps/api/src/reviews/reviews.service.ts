import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
    private readonly logger = new Logger(ReviewsService.name);

    constructor(
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        @InjectModel('Booking') private bookingModel: Model<any>,
        @InjectModel('User') private userModel: Model<any>,
    ) { }

    /**
     * Create a review after a completed booking
     */
    async create(dto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument> {
        // Booking must exist and be completed
        const booking = await this.bookingModel.findById(dto.booking);
        if (!booking) throw new NotFoundException('Booking not found');

        if (booking.status !== 'completed') {
            throw new BadRequestException('Can only review completed bookings');
        }

        // Reviewer must be part of the booking
        const renterId = booking.renter.toString();
        const ownerId = booking.owner.toString();
        if (reviewerId !== renterId && reviewerId !== ownerId) {
            throw new ForbiddenException('You are not part of this booking');
        }

        // Validate reviewee is the other party
        const revieweeId = dto.reviewee;
        if (reviewerId === renterId && revieweeId !== ownerId) {
            throw new BadRequestException('Renter can only review the owner');
        }
        if (reviewerId === ownerId && revieweeId !== renterId) {
            throw new BadRequestException('Owner can only review the renter');
        }

        // Check duplicate
        const existing = await this.reviewModel.findOne({
            booking: new Types.ObjectId(dto.booking),
            reviewer: new Types.ObjectId(reviewerId),
        });
        if (existing) throw new BadRequestException('You have already reviewed this booking');

        const review = new this.reviewModel({
            booking: new Types.ObjectId(dto.booking),
            reviewer: new Types.ObjectId(reviewerId),
            reviewee: new Types.ObjectId(dto.reviewee),
            revieweeType: dto.revieweeType,
            overallRating: dto.overallRating,
            communication: dto.communication,
            punctuality: dto.punctuality,
            comment: dto.comment,
        });

        const saved = await review.save();

        // Recalculate average rating for reviewee
        await this.recalculateRating(dto.reviewee);

        return saved;
    }

    /**
     * Get all reviews for a user (as reviewee)
     */
    async findByUser(userId: string) {
        return this.reviewModel
            .find({ reviewee: new Types.ObjectId(userId) })
            .populate('reviewer', 'displayName pictureUrl')
            .populate('booking', 'startDate endDate')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Check if user can review a booking (both direction)
     */
    async getReviewStatus(bookingId: string, userId: string) {
        const booking = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');

        const canReview = booking.status === 'completed' &&
            (booking.renter.toString() === userId || booking.owner.toString() === userId);

        const alreadyReviewed = await this.reviewModel.findOne({
            booking: new Types.ObjectId(bookingId),
            reviewer: new Types.ObjectId(userId),
        });

        return {
            canReview,
            alreadyReviewed: !!alreadyReviewed,
            bookingStatus: booking.status,
        };
    }

    /**
     * Recalculate and update a user's average rating
     */
    private async recalculateRating(userId: string): Promise<void> {
        const result = await this.reviewModel.aggregate([
            { $match: { reviewee: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$reviewee',
                    averageRating: { $avg: '$overallRating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        if (result.length > 0) {
            await this.userModel.findByIdAndUpdate(userId, {
                averageRating: Math.round(result[0].averageRating * 10) / 10,
                totalReviews: result[0].totalReviews,
            });
            this.logger.log(`Updated rating for user ${userId}: ${result[0].averageRating}`);
        }
    }
}
