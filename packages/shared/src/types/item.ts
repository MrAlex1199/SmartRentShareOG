export enum ItemCategory {
    ELECTRONICS = 'electronics',
    BOOKS = 'books',
    FURNITURE = 'furniture',
    KITCHEN = 'kitchen',
    SPORTS = 'sports',
    TOOLS = 'tools',
    CLOTHING = 'clothing',
    OTHER = 'other'
}

export enum ItemCondition {
    NEW = 'new',
    LIKE_NEW = 'like-new',
    GOOD = 'good',
    FAIR = 'fair'
}

export interface ItemLocation {
    university: string;
    building?: string;
    area: string;
}

export interface Item {
    _id: string;
    owner: string | any; // Populated User
    title: string;
    description: string;
    category: ItemCategory;
    tags: string[];

    // Pricing
    dailyPrice: number;
    weeklyPrice?: number;
    monthlyPrice?: number;
    deposit: number;

    // Media
    images: string[];

    // Availability
    isAvailable: boolean;
    availableFrom?: Date;
    availableTo?: Date;

    // Location & Delivery
    location: ItemLocation;
    deliveryOptions: ('pickup' | 'delivery')[];
    deliveryFee?: number;

    // Metadata
    condition: ItemCondition;
    views: number;
    favorites: number;

    createdAt: Date;
    updatedAt: Date;
}

export interface CreateItemDto {
    title: string;
    description: string;
    category: ItemCategory;
    tags?: string[];
    dailyPrice: number;
    deposit: number;
    images: string[];
    location: ItemLocation;
    condition: ItemCondition;
    deliveryOptions: ('pickup' | 'delivery')[];
}

export interface UpdateItemDto extends Partial<CreateItemDto> {
    isAvailable?: boolean;
}
