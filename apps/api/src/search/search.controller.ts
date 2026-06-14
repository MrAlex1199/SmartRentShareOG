import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchItemsDto, SuggestDto } from './dto/search-items.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * GET /search/items
   * Full-text search with filters, sorting, pagination, and faceted aggregations
   *
   * Query params:
   *   q         — search keyword
   *   category  — filter by category enum
   *   minPrice  — minimum daily price
   *   maxPrice  — maximum daily price
   *   province  — filter by province
   *   district  — filter by district
   *   condition — item condition
   *   sort      — relevance | price-asc | price-desc | newest | popular
   *   page      — page number (default: 1)
   *   limit     — results per page (default: 20, max: 100)
   */
  @Get('items')
  async searchItems(@Query() dto: SearchItemsDto) {
    return this.searchService.searchItems({
      q: dto.q,
      category: dto.category,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
      province: dto.province,
      district: dto.district,
      condition: dto.condition,
      sort: dto.sort,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
    });
  }

  /**
   * GET /search/suggest?q=xxx
   * Autocomplete suggestions for the search input
   * Returns up to 5 suggested item titles
   */
  @Get('suggest')
  async suggest(@Query('q') q: string) {
    if (!q || q.trim().length < 1) {
      return { suggestions: [] };
    }
    const suggestions = await this.searchService.suggest(q.trim());
    return { suggestions };
  }

  /**
   * GET /search/health
   * Check OpenSearch cluster health
   */
  @Get('health')
  async health() {
    const healthy = await this.searchService.isHealthy();
    return {
      opensearch: healthy ? 'healthy' : 'unavailable',
      fallback: healthy ? 'not needed' : 'MongoDB $text search active',
    };
  }

  /**
   * POST /search/reindex
   * Admin-only: bulk reindex all items from MongoDB → OpenSearch
   */
  @UseGuards(JwtAuthGuard)
  @Post('reindex')
  @HttpCode(HttpStatus.OK)
  async reindex() {
    const result = await this.searchService.reindexAll();
    return {
      message: 'Reindex complete',
      ...result,
    };
  }
}
