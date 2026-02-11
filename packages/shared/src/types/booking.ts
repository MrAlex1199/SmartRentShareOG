export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PAID = 'paid',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REJECTED = 'rejected',
    OVERDUE = 'overdue',
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
    item: string | any; // Can be populated
    renter: string | any; // Can be populated
    owner: string | any; // Can be populated

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

    // Documentation
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
