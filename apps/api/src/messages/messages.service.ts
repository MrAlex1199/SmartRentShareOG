import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel('Booking') private bookingModel: Model<any>,
    ) { }

    /** ตรวจสอบว่า userId เป็น renter หรือ owner ของ booking นี้ */
    private async assertAccess(bookingId: string, userId: string): Promise<any> {
        const booking = await this.bookingModel.findById(bookingId)
            .populate('renter', 'displayName pictureUrl')
            .populate('owner', 'displayName pictureUrl')
            .populate('item', 'title images');
        if (!booking) throw new NotFoundException('ไม่พบการจอง');

        const renterId = booking.renter._id?.toString() ?? booking.renter.toString();
        const ownerId = booking.owner._id?.toString() ?? booking.owner.toString();
        if (userId !== renterId && userId !== ownerId) {
            throw new ForbiddenException('คุณไม่ใช่ผู้เช่าหรือเจ้าของสินค้านี้');
        }
        return booking;
    }

    /** โหลดประวัติข้อความสำหรับ booking (100 ข้อความล่าสุด) */
    async getMessages(bookingId: string, userId: string): Promise<MessageDocument[]> {
        await this.assertAccess(bookingId, userId);
        return this.messageModel
            .find({ booking: new Types.ObjectId(bookingId) })
            .populate('sender', 'displayName pictureUrl')
            .sort({ createdAt: 1 })
            .limit(100)
            .exec();
    }

    /** บันทึกข้อความใหม่ */
    async createMessage(
        bookingId: string,
        senderId: string,
        content: string,
        messageType: 'text' | 'image' | 'system' = 'text',
    ): Promise<MessageDocument> {
        await this.assertAccess(bookingId, senderId);

        const msg = new this.messageModel({
            booking: new Types.ObjectId(bookingId),
            sender: new Types.ObjectId(senderId),
            content: content.trim().slice(0, 1000),
            messageType,
            isRead: false,
        });
        const saved = await msg.save();
        return this.messageModel.findById(saved._id).populate('sender', 'displayName pictureUrl') as any;
    }
}
