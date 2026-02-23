export enum BookingStatus {
    PENDING = 'pending',           // รอเจ้าของยืนยัน (24h auto-reject)
    CONFIRMED = 'confirmed',       // ยืนยันแล้ว รอผู้เช่าชำระเงิน
    PAID = 'paid',                 // ชำระเงินแล้ว เงิน hold ใน escrow รอนัดรับของ
    ACTIVE = 'active',             // รับของสำเร็จ (ทั้งคู่ confirm) กำลังเช่า
    COMPLETED = 'completed',       // คืนของสำเร็จ เงิน release — GP หัก 10%
    CANCELLED = 'cancelled',       // ยกเลิก (ก่อน PAID)
    REJECTED = 'rejected',         // ปฏิเสธโดยเจ้าของ
    OVERDUE = 'overdue',           // เกินกำหนดคืน
}

export enum DeliveryMethod {
    PICKUP = 'pickup',
    DELIVERY = 'delivery',
}

export interface StatusHistoryEntry {
    status: BookingStatus;
    timestamp: string;
    note?: string;
}

export interface BookingItemCondition {
    images: string[];
    notes: string;
    timestamp: string;
}

export interface Booking {
    _id: string;
    item: string | any;
    renter: string | any;
    owner: string | any;

    // Rental Period
    startDate: string;
    endDate: string;
    totalDays: number;

    // Pricing
    dailyPrice: number;
    totalPrice: number;
    deposit: number;
    deliveryFee?: number;

    // Status
    status: BookingStatus;
    statusHistory: StatusHistoryEntry[];

    // Delivery
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: string;
    pickupLocation?: string;

    // Appointment
    appointmentDate?: string;

    // Digital Agreement
    contractAgreedByRenter: boolean;
    contractAgreedByOwner: boolean;

    // Handover Confirmation
    renterConfirmedHandover: boolean;
    ownerConfirmedHandover: boolean;

    // Return Confirmation
    renterConfirmedReturn: boolean;
    ownerConfirmedReturn: boolean;

    // Item Condition
    itemConditionBefore?: BookingItemCondition;
    itemConditionAfter?: BookingItemCondition;

    createdAt: string;
    updatedAt: string;
}

export interface CreateBookingDto {
    item: string;
    startDate: string;
    endDate: string;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: string;
    pickupLocation?: string;
}

export interface UpdateBookingStatusDto {
    status: string;
    note?: string;
}
