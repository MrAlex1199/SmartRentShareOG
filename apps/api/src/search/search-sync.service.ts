import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchService } from './search.service';
import { Item, ItemDocument } from '../items/schemas/item.schema';

/**
 * SearchSyncService listens to MongoDB Change Streams on the `items` collection
 * and keeps the OpenSearch index in sync in real-time.
 *
 * Events handled:
 *  - insert  → indexItem()
 *  - update / replace → indexItem() (re-fetch full document)
 *  - delete  → deleteItem()
 *
 * Change Streams require MongoDB running as a replica set.
 * MongoDB Atlas always runs as a replica set.
 * For local dev with Docker single-node mongo, a replica set must be initiated.
 * If Change Streams are unavailable, the service logs a warning and exits gracefully
 * (ItemsService will still call indexItem/deleteItem directly on mutations).
 */
@Injectable()
export class SearchSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchSyncService.name);
  private changeStream: any = null;

  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    private readonly searchService: SearchService,
  ) {}

  async onModuleInit() {
    await this.startChangeStream();
  }

  async onModuleDestroy() {
    if (this.changeStream) {
      try {
        await this.changeStream.close();
        this.logger.log('Change stream closed');
      } catch (err: any) {
        this.logger.warn(`Error closing change stream: ${err.message}`);
      }
    }
  }

  private async startChangeStream(): Promise<void> {
    try {
      this.changeStream = this.itemModel.watch(
        [
          {
            $match: {
              operationType: { $in: ['insert', 'update', 'replace', 'delete'] },
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      );

      this.changeStream.on('change', async (event: any) => {
        try {
          await this.handleChangeEvent(event);
        } catch (err: any) {
          this.logger.error(`Error handling change event: ${err.message}`);
        }
      });

      this.changeStream.on('error', (err: any) => {
        this.logger.error(`Change stream error: ${err.message}`);
        // Attempt to restart after 10 seconds
        setTimeout(() => this.startChangeStream(), 10_000);
      });

      this.logger.log('MongoDB Change Stream started — OpenSearch sync active');
    } catch (err: any) {
      this.logger.warn(
        `Change Stream unavailable (${err.message}). ` +
        'OpenSearch will sync via direct calls from ItemsService only. ' +
        'For full real-time sync, ensure MongoDB runs as a replica set.',
      );
    }
  }

  private async handleChangeEvent(event: any): Promise<void> {
    const { operationType, documentKey, fullDocument } = event;
    const id = documentKey?._id?.toString();

    switch (operationType) {
      case 'insert':
      case 'replace':
        if (fullDocument) {
          // Populate owner for sync
          const populated = await this.itemModel
            .findById(fullDocument._id)
            .populate('owner', 'displayName pictureUrl')
            .lean();
          if (populated) await this.searchService.indexItem(populated);
        }
        break;

      case 'update':
        if (fullDocument) {
          const populated = await this.itemModel
            .findById(fullDocument._id)
            .populate('owner', 'displayName pictureUrl')
            .lean();
          if (populated) await this.searchService.indexItem(populated);
        } else if (id) {
          // Fallback: re-fetch by ID
          const item = await this.itemModel
            .findById(id)
            .populate('owner', 'displayName pictureUrl')
            .lean();
          if (item) await this.searchService.indexItem(item);
        }
        break;

      case 'delete':
        if (id) await this.searchService.deleteItem(id);
        break;

      default:
        break;
    }
  }
}
