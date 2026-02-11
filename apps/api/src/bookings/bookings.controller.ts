import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto, CheckAvailabilityDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItemsService } from '../items/items.service';
import { AvailabilityService } from './services/availability.service';
import { parseISO } from 'date-fns';

@Controller('bookings')
export class BookingsController {
    constructor(
        private readonly bookingsService: BookingsService,
        private readonly itemsService: ItemsService,
        private readonly availabilityService: AvailabilityService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
        // Get item details for pricing
        const item = await this.itemsService.findOne(createBookingDto.item);

        return this.bookingsService.create(
            createBookingDto,
            req.user.userId,
            item,
        );
    }

    @Get('my-bookings')
    @UseGuards(JwtAuthGuard)
    findMyBookings(@Request() req: any) {
        return this.bookingsService.findMyBookings(req.user.userId);
    }

    @Get('my-requests')
    @UseGuards(JwtAuthGuard)
    findMyRequests(@Request() req: any) {
        return this.bookingsService.findMyRequests(req.user.userId);
    }

    @Get('check-availability')
    async checkAvailability(@Query() query: CheckAvailabilityDto) {
        const startDate = parseISO(query.startDate);
        const endDate = parseISO(query.endDate);

        const isAvailable = await this.availabilityService.checkAvailability(
            query.itemId,
            startDate,
            endDate,
        );

        const bookedDates = await this.availabilityService.getBookedDates(query.itemId);

        return {
            available: isAvailable,
            bookedDates,
        };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.findOne(id, req.user.userId);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateBookingStatusDto,
        @Request() req: any,
    ) {
        return this.bookingsService.updateStatus(id, updateStatusDto, req.user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.cancel(id, req.user.userId);
    }
}
