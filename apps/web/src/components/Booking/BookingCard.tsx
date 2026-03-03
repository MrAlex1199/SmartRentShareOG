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

  const formatDate = (d: string) => format(new Date(d), 'd MMM yy', { locale: th });

  const canConfirm = viewType === 'owner' && booking.status === BookingStatus.PENDING;
  const canReject = viewType === 'owner' && booking.status === BookingStatus.PENDING;
  const canCancel = viewType === 'renter' && [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);

  const grandTotal = booking.totalPrice + (booking.deliveryFee || 0) + ((item as any)?.deposit || 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Thumbnail */}
        {item && (item as any).images?.length > 0 && (
          <div className="flex-shrink-0">
            <img
              src={(item as any).images[0]}
              alt={(item as any).title}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title + Status badge on same row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link
              href={`/bookings/${booking._id}`}
              className="text-sm sm:text-base font-semibold text-gray-900 hover:text-primary transition-colors leading-tight line-clamp-2 flex-1"
            >
              {(item as any)?.title || 'กำลังโหลด...'}
            </Link>
            <div className="flex-shrink-0">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          {/* Counterpart */}
          <p className="text-xs text-gray-500 mb-1.5">
            {viewType === 'renter' ? 'เจ้าของ' : 'ผู้เช่า'}: {otherUser?.displayName || '...'}
          </p>

          {/* Dates */}
          <p className="text-xs text-gray-500 mb-2">
            📅 {formatDate(booking.startDate)} – {formatDate(booking.endDate)} ({booking.totalDays} วัน)
          </p>

          {/* Price + Actions in responsive row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-xs text-gray-500">ยอดรวม </span>
              <span className="text-sm font-bold text-primary">฿{grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {canConfirm && (
                <button
                  onClick={() => onStatusUpdate?.(booking._id, BookingStatus.CONFIRMED)}
                  className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                >
                  ✅ ยืนยัน
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => onStatusUpdate?.(booking._id, BookingStatus.REJECTED)}
                  className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
                >
                  ❌ ปฏิเสธ
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => onStatusUpdate?.(booking._id, BookingStatus.CANCELLED)}
                  className="px-2.5 py-1 bg-gray-500 text-white text-xs font-medium rounded-lg hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
              )}
              <Link
                href={`/bookings/${booking._id}`}
                className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
              >
                ดูรายละเอียด →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
