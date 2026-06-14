import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchSyncService } from './search-sync.service';
import { SearchController } from './search.controller';
import { Item, ItemSchema } from '../items/schemas/item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchSyncService],
  exports: [SearchService],   // Export so ItemsModule can inject it
})
export class SearchModule {}
