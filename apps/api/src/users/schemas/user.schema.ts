import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User as UserInterface } from '@repo/shared';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User implements Omit<UserInterface, '_id' | 'createdAt' | 'updatedAt'> {
    @Prop({ required: true, unique: true })
    lineId!: string;

    @Prop({ required: true })
    displayName!: string;

    @Prop()
    pictureUrl!: string;

    @Prop()
    email!: string;

    @Prop({ default: 'student', enum: ['student', 'admin'] })
    role!: 'student' | 'admin';

    @Prop({ default: false })
    isVerified!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
