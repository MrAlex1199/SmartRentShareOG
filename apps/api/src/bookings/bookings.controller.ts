import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto, CheckAvailabilityDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItemsService } from '../items/items.service';
import { AvailabilityService } from './services/availability.service';
import { PaymentsService } from '../payments/payments.service';
import { parseISO } from 'date-fns';

@Controller('bookings')
export class BookingsController {
    constructor(
        private readonly bookingsService: BookingsService,
        private readonly itemsService: ItemsService,
        private readonly availabilityService: AvailabilityService,
        private readonly paymentsService: PaymentsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() createBookingDto: CreateBookingDto, @Request() req: any) {
        const item = await this.itemsService.findOne(createBookingDto.item);
        return this.bookingsService.create(createBookingDto, req.user.userId, item);
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
        const isAvailable = await this.availabilityService.checkAvailability(query.itemId, startDate, endDate);
        const bookedDates = await this.availabilityService.getBookedDates(query.itemId);
        return { available: isAvailable, bookedDates };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.findOne(id, req.user.userId);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto, @Request() req: any) {
        return this.bookingsService.updateStatus(id, dto, req.user.userId);
    }

    // ─── New Workflow Endpoints ───────────────────────────────────────────

    /** Set appointment date/time for pickup */
    @Patch(':id/appointment')
    @UseGuards(JwtAuthGuard)
    setAppointment(
        @Param('id') id: string,
        @Body() body: { appointmentDate: string },
        @Request() req: any,
    ) {
        return this.paymentsService.setAppointment(id, req.user.userId, body.appointmentDate);
    }

    /** Agree to rental terms (checkbox confirmation) */
    @Patch(':id/agree-contract')
    @UseGuards(JwtAuthGuard)
    agreeContract(@Param('id') id: string, @Request() req: any) {
        return this.paymentsService.agreeContract(id, req.user.userId);
    }

    /** Upload before/after condition photos */
    @Patch(':id/condition-photos')
    @UseGuards(JwtAuthGuard)
    uploadConditionPhotos(
        @Param('id') id: string,
        @Body() body: { phase: 'before' | 'after'; imageUrls: string[]; notes: string },
        @Request() req: any,
    ) {
        return this.paymentsService.uploadConditionPhotos(
            id,
            req.user.userId,
            body.phase,
            body.imageUrls,
            body.notes || '',
        );
    }

    /** Confirm handover (both must call) → ACTIVE */
    @Patch(':id/confirm-handover')
    @UseGuards(JwtAuthGuard)
    confirmHandover(@Param('id') id: string, @Request() req: any) {
        return this.paymentsService.confirmHandover(id, req.user.userId);
    }

    /** Confirm return (both must call) → COMPLETED + release escrow */
    @Patch(':id/confirm-return')
    @UseGuards(JwtAuthGuard)
    confirmReturn(@Param('id') id: string, @Request() req: any) {
        return this.paymentsService.confirmReturn(id, req.user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.bookingsService.cancel(id, req.user.userId);
    }
}
