import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from './schemas/item.schema';
import { CreateItemDto, UpdateItemDto, ItemCategory } from '@repo/shared';

@Injectable()
export class ItemsService {
    constructor(@InjectModel(Item.name) private itemModel: Model<ItemDocument>) { }

    async create(createItemDto: CreateItemDto, ownerId: string): Promise<Item> {
        const newItem = new this.itemModel({
            ...createItemDto,
            owner: ownerId,
        });
        return newItem.save();
    }

    async findAll(query: {
        category?: ItemCategory;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        sort?: string;
        limit?: number;
        skip?: number;
    }): Promise<Item[]> {
        const filter: any = { isAvailable: true };

        if (query.category) {
            filter.category = query.category;
        }

        if (query.search) {
            filter.$text = { $search: query.search };
        }

        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter.dailyPrice = {};
            if (query.minPrice !== undefined) filter.dailyPrice.$gte = query.minPrice;
            if (query.maxPrice !== undefined) filter.dailyPrice.$lte = query.maxPrice;
        }

        let sortOption: any = { createdAt: -1 }; // Default: newest first
        if (query.sort === 'price-asc') sortOption = { dailyPrice: 1 };
        if (query.sort === 'price-desc') sortOption = { dailyPrice: -1 };
        if (query.sort === 'popular') sortOption = { views: -1 };

        const limit = query.limit || 20;
        const skip = query.skip || 0;

        return this.itemModel
            .find(filter)
            .populate('owner', 'displayName pictureUrl')
            .sort(sortOption)
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async findTrending(limit: number = 10): Promise<Item[]> {
        return this.itemModel
            .find({ isAvailable: true })
            .populate('owner', 'displayName pictureUrl')
            .sort({ views: -1 })
            .limit(limit)
            .exec();
    }

    async findRecent(limit: number = 10): Promise<Item[]> {
        return this.itemModel
            .find({ isAvailable: true })
            .populate('owner', 'displayName pictureUrl')
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    async findByOwner(ownerId: string): Promise<Item[]> {
        return this.itemModel
            .find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(id: string): Promise<Item> {
        const item = await this.itemModel.findById(id).populate('owner', 'displayName pictureUrl email lineId').exec();
        if (!item) {
            throw new NotFoundException(`Item with ID ${id} not found`);
        }
        return item;
    }

    async update(id: string, updateItemDto: UpdateItemDto, userId: string): Promise<Item> {
        const item = await this.itemModel.findById(id);
        if (!item) {
            throw new NotFoundException(`Item with ID ${id} not found`);
        }

        if (item.owner.toString() !== userId) {
            throw new ForbiddenException('You can only update your own items');
        }

        return this.itemModel.findByIdAndUpdate(id, updateItemDto, { new: true }).exec() as Promise<Item>;
    }

    async remove(id: string, userId: string): Promise<void> {
        const item = await this.itemModel.findById(id);
        if (!item) {
            throw new NotFoundException(`Item with ID ${id} not found`);
        }

        if (item.owner.toString() !== userId) {
            throw new ForbiddenException('You can only delete your own items');
        }

        await this.itemModel.findByIdAndDelete(id).exec();
    }
}
