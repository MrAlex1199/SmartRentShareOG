import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item, ItemSchema } from './schemas/item.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Item.name, schema: ItemSchema },
            { name: Booking.name, schema: BookingSchema },
        ]),
        SearchModule,   // provides SearchService for auto-indexing
    ],
    controllers: [ItemsController],
    providers: [ItemsService],
    exports: [ItemsService, MongooseModule],
})
export class ItemsModule { }
