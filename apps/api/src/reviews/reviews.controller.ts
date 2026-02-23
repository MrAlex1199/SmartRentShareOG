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
@UseGuards(JwtAuthGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    async createReview(@Body() dto: CreateReviewDto, @Request() req: any) {
        return this.reviewsService.create(dto, req.user.userId);
    }

    @Get('user/:userId')
    async getUserReviews(@Param('userId') userId: string) {
        return this.reviewsService.findByUser(userId);
    }

    @Get('booking/:bookingId/status')
    async getReviewStatus(@Param('bookingId') bookingId: string, @Request() req: any) {
        return this.reviewsService.getReviewStatus(bookingId, req.user.userId);
    }
}
