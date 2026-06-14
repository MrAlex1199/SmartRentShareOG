import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Item, ItemDocument } from './schemas/item.schema';
import { CreateItemDto, UpdateItemDto, ItemCategory } from '@repo/shared';
import { SearchService } from '../search/search.service';


@Injectable()
export class ItemsService {
    constructor(
        @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
        @InjectModel('Booking') private bookingModel: Model<any>,
        private readonly searchService: SearchService,
    ) { }


    async create(createItemDto: CreateItemDto, ownerId: string): Promise<Item> {
        const newItem = new this.itemModel({
            ...createItemDto,
            owner: ownerId,
        });
        const saved = await newItem.save();
        // Sync to OpenSearch (populate owner for indexing)
        const populated = await this.itemModel
            .findById(saved._id)
            .populate('owner', 'displayName pictureUrl')
            .lean();
        if (populated) this.searchService.indexItem(populated).catch(() => null);
        return saved;
    }

    async findAll(query: {
        category?: ItemCategory;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        sort?: string;
        limit?: number;
        skip?: number;
        owner?: string;
        province?: string;
        district?: string;
    }): Promise<Item[]> {
        const filter: any = {};
        // When filtering by owner (profile page), show all. Otherwise only available
        if (!query.owner) filter.isAvailable = true;

        if (query.owner) {
            filter.owner = query.owner;
        }

        if (query.category) {
            filter.category = query.category;
        }

        if (query.search) {
            filter.$text = { $search: query.search };
        }

        if (query.province) {
            filter['location.province'] = { $regex: query.province, $options: 'i' };
        }

        if (query.district) {
            filter['location.district'] = { $regex: query.district, $options: 'i' };
        }

        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter.dailyPrice = {};
            if (query.minPrice !== undefined) filter.dailyPrice.$gte = query.minPrice;
            if (query.maxPrice !== undefined) filter.dailyPrice.$lte = query.maxPrice;
        }

        let sortOption: any = { createdAt: -1 };
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

    /**
     * Returns distinct provinces that have at least one available item
     */
    async getDistinctProvinces(): Promise<string[]> {
        const provinces = await this.itemModel
            .distinct('location.province', { isAvailable: true })
            .exec();
        return (provinces as string[]).filter(Boolean).sort();
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

        const updated = await this.itemModel.findByIdAndUpdate(id, updateItemDto, { new: true }).exec() as unknown as Item;
        // Sync updated document to OpenSearch
        const populated = await this.itemModel
            .findById(id)
            .populate('owner', 'displayName pictureUrl')
            .lean();
        if (populated) this.searchService.indexItem(populated).catch(() => null);
        return updated;
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
        // Remove from OpenSearch index
        this.searchService.deleteItem(id).catch(() => null);
    }

    /**
     * Toggle item availability (owner can hide/show listing)
     * ─ Blocks if PAID/ACTIVE bookings exist (must complete first)
     * ─ Auto-cancels PENDING/CONFIRMED bookings when hiding
     */
    async setAvailability(itemId: string, userId: string, isAvailable: boolean): Promise<any> {
        const item = await this.itemModel.findById(itemId);
        if (!item) throw new NotFoundException('ไม่พบสินค้า');
        if (item.owner.toString() !== userId) throw new ForbiddenException('คุณไม่ใช่เจ้าของสินค้านี้');

        if (!isAvailable) {
            // Check for blocking bookings (PAID or ACTIVE)
            const blockingBookings = await this.bookingModel.find({
                item: itemId,
                status: { $in: ['paid', 'active'] },
            });
            if (blockingBookings.length > 0) {
                throw new BadRequestException(
                    `ไม่สามารถซ่อนสินค้าได้ มีการจองที่กำลังดำเนินอยู่ ${blockingBookings.length} รายการ (PAID/ACTIVE) รอให้ผู้เช่าคืนของก่อน`
                );
            }

            // Auto-cancel PENDING and CONFIRMED bookings
            const cancelable = await this.bookingModel.find({
                item: itemId,
                status: { $in: ['pending', 'confirmed'] },
            });
            if (cancelable.length > 0) {
                await this.bookingModel.updateMany(
                    { item: itemId, status: { $in: ['pending', 'confirmed'] } },
                    {
                        status: 'cancelled',
                        $push: {
                            statusHistory: {
                                status: 'cancelled',
                                timestamp: new Date(),
                                note: 'เจ้าของซ่อนสินค้า — ยกเลิกการจองอัตโนมัติ',
                            },
                        },
                    },
                );
            }
        }

        const updated = await this.itemModel.findByIdAndUpdate(
            itemId,
            { isAvailable },
            { new: true },
        );
        // Sync availability change to OpenSearch
        if (updated) {
            const populated = await this.itemModel
                .findById(itemId)
                .populate('owner', 'displayName pictureUrl')
                .lean();
            if (populated) this.searchService.indexItem(populated).catch(() => null);
        }
        return { item: updated, message: isAvailable ? 'เปิดรับจองแล้ว' : 'ซ่อนสินค้าแล้ว' };
    }

    async updateBlackoutDates(id: string, blackoutDates: { startDate: Date; endDate: Date; reason?: string }[], ownerId: string) {
        const item = await this.itemModel.findById(id);
        if (!item) throw new NotFoundException('Item not found');

        if (String(item.owner._id || item.owner) !== ownerId) {
            throw new ForbiddenException('You can only update blackout dates for your own items');
        }

        item.blackoutDates = blackoutDates || [];
        return item.save();
    }
}
