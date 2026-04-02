import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item, ItemSchema } from './schemas/item.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Item.name, schema: ItemSchema },
            { name: Booking.name, schema: BookingSchema },
        ]),
    ],
    controllers: [ItemsController],
    providers: [ItemsService],
    exports: [ItemsService],
})
export class ItemsModule { }
