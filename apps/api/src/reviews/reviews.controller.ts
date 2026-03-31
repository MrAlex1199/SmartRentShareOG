import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createReview(@Body() dto: CreateReviewDto, @Request() req: any) {
        return this.reviewsService.create(dto, req.user.userId);
    }

    /** Public: reviews of a specific item (shown on item detail page) */
    @Get('item/:itemId')
    async getItemReviews(@Param('itemId') itemId: string) {
        return this.reviewsService.findByItem(itemId);
    }

    /** Public: reviews of a specific user/owner (shown on owner profile) */
    @Get('user/:userId')
    async getUserReviews(@Param('userId') userId: string) {
        return this.reviewsService.findByUser(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('booking/:bookingId/status')
    async getReviewStatus(@Param('bookingId') bookingId: string, @Request() req: any) {
        return this.reviewsService.getReviewStatus(bookingId, req.user.userId);
    }
}
