'use client';

import { Booking, BookingStatus } from '@repo/shared';
import { BookingStatusBadge } from './BookingStatusBadge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Link from 'next/link';

interface BookingCardProps {
  booking: Booking;
  viewType: 'renter' | 'owner';
  onStatusUpdate?: (bookingId: string, newStatus: BookingStatus) => void;
}

export function BookingCard({ booking, viewType, onStatusUpdate }: BookingCardProps) {
  const item = typeof booking.item === 'object' ? booking.item : null;
  const otherUser = viewType === 'renter' 
    ? (typeof booking.owner === 'object' ? booking.owner : null)
    : (typeof booking.renter === 'object' ? booking.renter : null);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy', { locale: th });
  };

  const canConfirm = viewType === 'owner' && booking.status === BookingStatus.PENDING;
  const canReject = viewType === 'owner' && booking.status === BookingStatus.PENDING;
  const canCancel = viewType === 'renter' && [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Item Image */}
        {item && item.images && item.images.length > 0 && (
          <div className="flex-shrink-0">
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Booking Details */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Link 
                href={`/bookings/${booking._id}`}
                className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors"
              >
                {item?.title || 'Loading...'}
              </Link>
              <p className="text-sm text-gray-600 mt-1">
                {viewType === 'renter' ? 'เจ้าของ' : 'ผู้เช่า'}: {otherUser?.displayName || 'Loading...'}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span>{booking.totalDays} วัน</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="space-y-1">
                <div>
                  <span className="text-gray-600">ค่าเช่า: </span>
                  <span className="font-semibold text-gray-900">
                    ฿{booking.totalPrice.toLocaleString()}
                  </span>
                </div>
                {booking.deliveryFee && booking.deliveryFee > 0 && (
                  <div>
                    <span className="text-gray-600">ค่าจัดส่ง: </span>
                    <span className="font-semibold text-gray-900">
                      ฿{booking.deliveryFee.toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">ค่ามัดจำ: </span>
                  <span className="font-semibold text-gray-900">
                    ฿{(item?.deposit || 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-1 border-t border-gray-200">
                  <span className="text-gray-600">ยอดรวมทั้งหมด: </span>
                  <span className="text-lg font-bold text-primary">
                    ฿{(booking.totalPrice + (booking.deliveryFee || 0) + (item?.deposit || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canConfirm && (
                <button
                  onClick={() => onStatusUpdate?.(booking._id, BookingStatus.CONFIRMED)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  ยืนยัน
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => onStatusUpdate?.(booking._id, BookingStatus.REJECTED)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  ปฏิเสธ
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => onStatusUpdate?.(booking._id, BookingStatus.CANCELLED)}
                  className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
              )}
              <Link
                href={`/bookings/${booking._id}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                ดูรายละเอียด
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
