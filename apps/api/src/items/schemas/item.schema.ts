import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Item as ItemInterface, ItemCategory, ItemCondition } from '@repo/shared';

export type ItemDocument = Item & Document;

@Schema({ timestamps: true })
export class Item implements Omit<ItemInterface, '_id' | 'createdAt' | 'updatedAt' | 'owner'> {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    owner: any;

    @Prop({ required: true })
    title!: string;

    @Prop({ required: true })
    description!: string;

    @Prop({ required: true, enum: ItemCategory })
    category!: ItemCategory;

    @Prop({ type: [String], default: [] })
    tags!: string[];

    // Pricing
    @Prop({ required: true })
    dailyPrice!: number;

    @Prop()
    weeklyPrice?: number;

    @Prop()
    monthlyPrice?: number;

    @Prop({ required: true })
    deposit!: number;

    // Media
    @Prop({ type: [String], default: [] })
    images!: string[];

    // Availability
    @Prop({ default: true })
    isAvailable!: boolean;

    @Prop()
    availableFrom?: Date;

    @Prop()
    availableTo?: Date;

    // Location
    @Prop({
        type: {
            university: { type: String, required: true },
            building: { type: String },
            area: { type: String, required: true }
        },
        required: true,
        _id: false
    })
    location!: {
        university: string;
        building?: string;
        area: string;
    };

    @Prop({ type: [String], required: true })
    deliveryOptions!: ('pickup' | 'delivery')[];

    @Prop()
    deliveryFee?: number;

    @Prop({ required: true, enum: ItemCondition })
    condition!: ItemCondition;

    @Prop({ default: 0 })
    views!: number;

    @Prop({ default: 0 })
    favorites!: number;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Add text index for search
ItemSchema.index({ title: 'text', description: 'text', tags: 'text' });
