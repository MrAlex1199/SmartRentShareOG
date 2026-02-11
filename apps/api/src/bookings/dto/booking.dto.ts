import { IsNotEmpty, IsEnum, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DeliveryMethod } from '../schemas/booking.schema';

export class CreateBookingDto {
    @IsNotEmpty()
    @IsString()
    item!: string;

    @IsNotEmpty()
    @IsDateString()
    startDate!: string;

    @IsNotEmpty()
    @IsDateString()
    endDate!: string;

    @IsNotEmpty()
    @IsEnum(DeliveryMethod)
    deliveryMethod!: DeliveryMethod;

    @IsOptional()
    @IsString()
    deliveryAddress?: string;

    @IsOptional()
    @IsString()
    pickupLocation?: string;
}

export class UpdateBookingStatusDto {
    @IsNotEmpty()
    @IsString()
    status!: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CheckAvailabilityDto {
    @IsNotEmpty()
    @IsString()
    itemId!: string;

    @IsNotEmpty()
    @IsDateString()
    startDate!: string;

    @IsNotEmpty()
    @IsDateString()
    endDate!: string;
}
