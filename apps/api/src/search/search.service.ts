import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '@opensearch-project/opensearch';
import { Item, ItemDocument } from '../items/schemas/item.schema';

/**
 * Shape of a document stored in OpenSearch index
 */
export interface ItemSearchDocument {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  condition: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  deposit: number;
  images: string[];
  isAvailable: boolean;
  province: string;
  district: string;
  area: string;
  deliveryOptions: string[];
  deliveryFee?: number;
  views: number;
  favorites: number;
  ownerId: string;
  ownerName: string;
  ownerPicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  total: number;
  items: (ItemSearchDocument & { _score?: number; _highlight?: Record<string, string[]> })[];
  aggregations?: {
    byCategory: { key: string; count: number }[];
    priceStats: { min: number; max: number; avg: number };
    byProvince: { key: string; count: number }[];
  };
}

@Injectable()
export class SearchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchService.name);
  private client?: Client;
  private readonly indexName: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {
    const node = this.configService.get<string>('OPENSEARCH_NODE', 'http://localhost:9200');
    const username = this.configService.get<string>('OPENSEARCH_USERNAME', '');
    const password = this.configService.get<string>('OPENSEARCH_PASSWORD', '');
    this.indexName = this.configService.get<string>('OPENSEARCH_INDEX_ITEMS', 'items');

    const clientOptions: any = { node };
    if (username && password) {
      clientOptions.auth = { username, password };
    }

    try {
      // Validate URL format first
      new URL(node);
      this.client = new Client(clientOptions);
    } catch (err: any) {
      this.logger.warn(`Failed to initialize OpenSearch client (Invalid URL: ${node}). Search will operate in MongoDB fallback mode. Error: ${err.message}`);
      // this.client remains undefined
    }
  }

  async onModuleInit() {
    if (this.client) {
      await this.ensureIndex();
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client!.close();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Index Management
  // ──────────────────────────────────────────────────────────────

  /**
   * Create the items index with proper mappings if it does not exist
   */
  private async ensureIndex(): Promise<void> {
    if (!this.client) return;
    try {
      const exists = await this.client!.indices.exists({ index: this.indexName });
      if (exists.body) {
        this.logger.log(`OpenSearch index "${this.indexName}" already exists`);
        return;
      }

      await this.client!.indices.create({
        index: this.indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,             // 0 replicas for single-node dev
            analysis: {
              analyzer: {
                thai_analyzer: {
                  type: 'custom',
                  tokenizer: 'thai',           // built-in Thai tokenizer
                  filter: ['lowercase'],
                },
              },
            },
          },
          mappings: {
            properties: {
              title:         { type: 'text', analyzer: 'thai_analyzer', fields: { keyword: { type: 'keyword' } } },
              description:   { type: 'text', analyzer: 'thai_analyzer' },
              category:      { type: 'keyword' },
              tags:          { type: 'keyword' },
              condition:     { type: 'keyword' },
              dailyPrice:    { type: 'float' },
              weeklyPrice:   { type: 'float' },
              monthlyPrice:  { type: 'float' },
              deposit:       { type: 'float' },
              images:        { type: 'keyword', index: false },
              isAvailable:   { type: 'boolean' },
              province:      { type: 'keyword' },
              district:      { type: 'keyword' },
              area:          { type: 'text' },
              deliveryOptions: { type: 'keyword' },
              deliveryFee:   { type: 'float' },
              views:         { type: 'integer' },
              favorites:     { type: 'integer' },
              ownerId:       { type: 'keyword' },
              ownerName:     { type: 'text', fields: { keyword: { type: 'keyword' } } },
              ownerPicture:  { type: 'keyword', index: false },
              createdAt:     { type: 'date' },
              updatedAt:     { type: 'date' },
            },
          },
        },
      });

      this.logger.log(`OpenSearch index "${this.indexName}" created successfully`);
    } catch (err: any) {
      this.logger.error(`Failed to ensure OpenSearch index: ${err.message}`);
      // Don't throw — allow app to start even if OpenSearch is temporarily down
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Document Operations
  // ──────────────────────────────────────────────────────────────

  /**
   * Convert a Mongoose Item document to an OpenSearch document shape
   */
  private toDoc(item: any): Omit<ItemSearchDocument, '_id'> {
    const owner = item.owner ?? {};
    return {
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags ?? [],
      condition: item.condition,
      dailyPrice: item.dailyPrice,
      weeklyPrice: item.weeklyPrice,
      monthlyPrice: item.monthlyPrice,
      deposit: item.deposit,
      images: item.images ?? [],
      isAvailable: item.isAvailable,
      province: item.location?.province ?? '',
      district: item.location?.district ?? '',
      area: item.location?.area ?? '',
      deliveryOptions: item.deliveryOptions ?? [],
      deliveryFee: item.deliveryFee,
      views: item.views ?? 0,
      favorites: item.favorites ?? 0,
      ownerId: typeof owner === 'object' && owner._id ? owner._id.toString() : owner.toString(),
      ownerName: typeof owner === 'object' ? (owner.displayName ?? '') : '',
      ownerPicture: typeof owner === 'object' ? owner.pictureUrl : undefined,
      createdAt: item.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: item.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  /**
   * Index (create or update) a single item
   */
  async indexItem(item: any): Promise<void> {
    if (!this.client) return;
    try {
      const doc = this.toDoc(item);
      const id = item._id?.toString() ?? item.id?.toString();

      await this.client!.index({
        index: this.indexName,
        id,
        body: doc,
        refresh: 'wait_for',   // immediate visibility in search (dev-friendly)
      });

      this.logger.debug(`Indexed item ${id}`);
    } catch (err: any) {
      this.logger.warn(`Failed to index item: ${err.message}`);
    }
  }

  /**
   * Delete a document from the index
   */
  async deleteItem(id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client!.delete({
        index: this.indexName,
        id,
        refresh: 'wait_for',
      });
      this.logger.debug(`Deleted item ${id} from index`);
    } catch (err: any) {
      if (err?.meta?.statusCode !== 404) {
        this.logger.warn(`Failed to delete item ${id}: ${err.message}`);
      }
    }
  }

  // ... (Search methods remain largely the same, they already check isHealthy())


  // ──────────────────────────────────────────────────────────────
  // Search
  // ──────────────────────────────────────────────────────────────

  async searchItems(params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    province?: string;
    district?: string;
    condition?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResult> {
    const { q, category, minPrice, maxPrice, province, district, condition, sort, page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    // ── Build query ──────────────────────────────────────────────
    const mustClauses: any[] = [];
    const filterClauses: any[] = [{ term: { isAvailable: true } }];

    if (q && q.trim()) {
      mustClauses.push({
        bool: {
          should: [
            // 1. Full-text with fuzziness (handles slight misspellings, e.g. "laptoop" -> "laptop")
            {
              multi_match: {
                query: q.trim(),
                fields: ['title^3', 'description', 'tags^2', 'ownerName'],
                fuzziness: 'AUTO',
                prefix_length: 1,
                type: 'best_fields',
              },
            },
            // 2. Prefix matching specifically on title (handles partial words, e.g. "mac" -> "MacBook")
            {
              match_phrase_prefix: {
                title: {
                  query: q.trim(),
                  max_expansions: 10
                }
              }
            }
          ],
          minimum_should_match: 1,
        }
      });
    }

    if (category) filterClauses.push({ term: { category } });
    if (province) filterClauses.push({ term: { province } });
    if (district) filterClauses.push({ term: { district } });
    if (condition) filterClauses.push({ term: { condition } });

    if (minPrice !== undefined || maxPrice !== undefined) {
      const rangeFilter: any = {};
      if (minPrice !== undefined) rangeFilter.gte = minPrice;
      if (maxPrice !== undefined) rangeFilter.lte = maxPrice;
      filterClauses.push({ range: { dailyPrice: rangeFilter } });
    }

    // ── Build sort ───────────────────────────────────────────────
    let sortOption: any[];
    switch (sort) {
      case 'price-asc':  sortOption = [{ dailyPrice: 'asc' }];  break;
      case 'price-desc': sortOption = [{ dailyPrice: 'desc' }]; break;
      case 'newest':     sortOption = [{ createdAt: 'desc' }];  break;
      case 'popular':    sortOption = [{ views: 'desc' }];      break;
      default:
        // relevance — let ES/OpenSearch score handle it; secondary sort by newest
        sortOption = q ? ['_score', { createdAt: 'desc' }] : [{ createdAt: 'desc' }];
    }

    // ── Aggregations (facets) ────────────────────────────────────
    const aggs = {
      by_category: { terms: { field: 'category', size: 20 } },
      price_stats: { stats: { field: 'dailyPrice' } },
      by_province:  { terms: { field: 'province', size: 30 } },
    };

    try {
      // First try OpenSearch if it's healthy
      const isHealthy = await this.isHealthy();
      if (!isHealthy) {
        throw new Error('OpenSearch is unavailable, using MongoDB fallback');
      }

      const response = await this.client!.search({
        index: this.indexName,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
              filter: filterClauses,
            },
          },
          sort: sortOption,
          aggs,
          highlight: q ? {
            fields: {
              title:       { number_of_fragments: 0 },
              description: { fragment_size: 150, number_of_fragments: 2 },
            },
            pre_tags:  ['<mark>'],
            post_tags: ['</mark>'],
          } : undefined,
        },
      });

      const body = response.body as any;
      const hits = body.hits;
      const aggsBody = body.aggregations as Record<string, any> | undefined;

      const items = hits.hits.map((hit: any) => ({
        ...hit._source,
        _id: hit._id,
        _score: hit._score,
        _highlight: hit.highlight,
      }));

      return {
        total: typeof hits.total === 'object' ? (hits.total.value as number) : (hits.total as number),
        items,
        aggregations: aggsBody ? {
          byCategory: (aggsBody['by_category']?.buckets ?? []).map((b: any) => ({ key: b.key as string, count: b.doc_count as number })),
          priceStats: {
            min: (aggsBody['price_stats']?.min as number) ?? 0,
            max: (aggsBody['price_stats']?.max as number) ?? 0,
            avg: (aggsBody['price_stats']?.avg as number) ?? 0,
          },
          byProvince: (aggsBody['by_province']?.buckets ?? []).map((b: any) => ({ key: b.key as string, count: b.doc_count as number })),
        } : undefined,
      };
    } catch (err: any) {
      this.logger.warn(`OpenSearch search failed or unavailable, falling back to MongoDB: ${err.message}`);
      return this.fallbackSearchToMongo(params);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // MongoDB Fallback Implementation
  // ──────────────────────────────────────────────────────────────

  private async fallbackSearchToMongo(params: any): Promise<SearchResult> {
    const { q, category, minPrice, maxPrice, province, condition, sort, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const matchStage: any = { isAvailable: true };

    if (q && q.trim()) {
      // Use regex for partial matching on title or description
      const regex = new RegExp(q.trim(), 'i');
      matchStage.$or = [{ title: regex }, { description: regex }];
    }
    if (category) matchStage.category = category;
    if (condition) matchStage.condition = condition;
    if (province) matchStage['location.province'] = province;

    if (minPrice !== undefined || maxPrice !== undefined) {
      matchStage.dailyPrice = {};
      if (minPrice !== undefined) matchStage.dailyPrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) matchStage.dailyPrice.$lte = Number(maxPrice);
    }

    let sortStage: any = { createdAt: -1 };
    switch (sort) {
      case 'price-asc': sortStage = { dailyPrice: 1 }; break;
      case 'price-desc': sortStage = { dailyPrice: -1 }; break;
      case 'newest': sortStage = { createdAt: -1 }; break;
      case 'popular': sortStage = { views: -1 }; break;
    }

    try {
      const [items, totalCount] = await Promise.all([
        this.itemModel.find(matchStage).populate('owner', 'displayName pictureUrl').sort(sortStage).skip(skip).limit(Number(limit)).lean(),
        this.itemModel.countDocuments(matchStage)
      ]);

      return {
        total: totalCount,
        items: items.map(item => ({ ...this.toDoc(item), _id: item._id.toString() })) as any[],
        // Simple aggregations fallback (can be expanded if needed)
        aggregations: {
          byCategory: [],
          priceStats: { min: 0, max: 0, avg: 0 },
          byProvince: []
        }
      };
    } catch (error: any) {
      this.logger.error(`MongoDB fallback search failed: ${error.message} - Stack: ${error.stack}`);
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Autocomplete / Suggest
  // ──────────────────────────────────────────────────────────────

  async suggest(prefix: string): Promise<string[]> {
    if (!prefix || prefix.trim().length < 1) return [];
    try {
      // First try OpenSearch if it's healthy
      const isHealthy = await this.isHealthy();
      if (!isHealthy) {
        throw new Error('OpenSearch is unavailable, using MongoDB fallback');
      }

      const response = await this.client!.search({
        index: this.indexName,
        body: {
          size: 0,
          query: {
            bool: {
              must: [
                { match_phrase_prefix: { title: { query: prefix.trim(), max_expansions: 10 } } },
              ],
              filter: [{ term: { isAvailable: true } }],
            },
          },
          aggs: {
            suggestions: {
              terms: { field: 'title.keyword', size: 8 },
            },
          },
        },
      });

      // Extract unique titles from aggregation
      const aggsAny = response.body.aggregations as Record<string, any> | undefined;
      const buckets: any[] = aggsAny?.['suggestions']?.buckets ?? [];
      return buckets
        .map((b: any) => b.key as string)
        .filter((title: string) => title.toLowerCase().includes(prefix.toLowerCase()))
        .slice(0, 5);
    } catch (err: any) {
      this.logger.warn(`Suggest failed or unavailable, falling back to MongoDB: ${err.message}`);
      return this.fallbackSuggestToMongo(prefix);
    }
  }

  private async fallbackSuggestToMongo(prefix: string): Promise<string[]> {
    try {
      const regex = new RegExp(`^${prefix.trim()}`, 'i');
      const items = await this.itemModel
        .find({ isAvailable: true, title: regex })
        .select('title')
        .limit(10)
        .lean()
        .exec();

      const uniqueTitles = Array.from(new Set(items.map(i => i.title)));
      return uniqueTitles.slice(0, 5);
    } catch (error) {
      this.logger.error(`MongoDB fallback suggest failed: ${error}`);
      return [];
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Admin — Bulk Reindex from MongoDB
  // ──────────────────────────────────────────────────────────────

  async reindexAll(): Promise<{ indexed: number; errors: number }> {
    this.logger.log('Starting full reindex from MongoDB...');
    let indexed = 0;
    let errors = 0;

    try {
      // Delete and recreate index for clean reindex
      const exists = await this.client!.indices.exists({ index: this.indexName });
      if (exists.body) {
        await this.client!.indices.delete({ index: this.indexName });
        this.logger.log(`Deleted existing index "${this.indexName}"`);
      }
      await this.ensureIndex();

      // Fetch all items in batches of 100
      const batchSize = 100;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const items = await this.itemModel
          .find()
          .populate('owner', 'displayName pictureUrl')
          .skip(skip)
          .limit(batchSize)
          .lean()
          .exec();

        if (items.length === 0) {
          hasMore = false;
          break;
        }

        // Bulk index
        const body = items.flatMap((item) => [
          { index: { _index: this.indexName, _id: item._id.toString() } },
          this.toDoc(item),
        ]);

        const bulkResponse = await this.client!.bulk({ body, refresh: true });

        if (bulkResponse.body.errors) {
          const errorItems = bulkResponse.body.items.filter((i: any) => i.index?.error);
          errors += errorItems.length;
          indexed += items.length - errorItems.length;
          errorItems.forEach((i: any) => this.logger.error(`Bulk index error: ${JSON.stringify(i.index.error)}`));
        } else {
          indexed += items.length;
        }

        skip += batchSize;
        this.logger.log(`Reindex progress: ${indexed + errors} documents processed`);
      }

      this.logger.log(`Reindex complete: ${indexed} indexed, ${errors} errors`);
      return { indexed, errors };
    } catch (err: any) {
      this.logger.error(`Reindex failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check if OpenSearch is reachable
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client!.cluster.health({ timeout: '5s' });
      return ['green', 'yellow'].includes(response.body.status);
    } catch {
      return false;
    }
  }
}
