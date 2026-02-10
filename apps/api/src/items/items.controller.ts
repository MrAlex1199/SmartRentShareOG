import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateItemDto, UpdateItemDto, ItemCategory } from '@repo/shared';

@Controller('items')
export class ItemsController {
    constructor(private readonly itemsService: ItemsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createItemDto: CreateItemDto, @Request() req: any) {
        return this.itemsService.create(createItemDto, req.user.userId);
    }

    // IMPORTANT: Specific routes MUST come before dynamic routes like :id
    @Get('trending')
    findTrending(@Query('limit') limit?: string) {
        return this.itemsService.findTrending(limit ? Number(limit) : 10);
    }

    @Get('recent')
    findRecent(@Query('limit') limit?: string) {
        return this.itemsService.findRecent(limit ? Number(limit) : 10);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-listings')
    findMyListings(@Request() req: any) {
        return this.itemsService.findByOwner(req.user.userId);
    }

    @Get()
    findAll(
        @Query('category') category?: ItemCategory,
        @Query('search') search?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('sort') sort?: string,
        @Query('limit') limit?: string,
        @Query('skip') skip?: string,
    ) {
        return this.itemsService.findAll({
            category,
            search,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort,
            limit: limit ? Number(limit) : undefined,
            skip: skip ? Number(skip) : undefined,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.itemsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto, @Request() req: any) {
        return this.itemsService.update(id, updateItemDto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.itemsService.remove(id, req.user.userId);
    }
}
