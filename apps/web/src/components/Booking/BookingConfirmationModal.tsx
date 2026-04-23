'use client';

import { CreateBookingDto } from '@repo/shared';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingData: {
    itemTitle: string;
    itemImage?: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    dailyPrice: number;
    totalPrice: number;
    deposit: number;
    deliveryMethod: string;
    deliveryFee?: number;
  };
  loading?: boolean;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  bookingData,
  loading = false,
}: BookingConfirmationModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const GP_PERCENT = 20;
  const rentTotal = bookingData.totalPrice; // ค่าเช่าล้วน
  const deliveryFee = bookingData.deliveryFee || 0;
  const deposit = bookingData.deposit;
  const grandTotal = rentTotal + deliveryFee + deposit; // ยอดรวมที่ผู้เช่าต้องจ่าย
  const gpFee = Math.round(rentTotal * GP_PERCENT / 100); // GP 20% จากค่าเช่าเท่านั้น
  const ownerReceives = rentTotal - gpFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">ยืนยันการจอง</h3>
              <p className="text-sm text-gray-500 mt-1">กรุณาตรวจสอบรายละเอียดก่อนยืนยัน</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Item Info */}
          <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            {bookingData.itemImage && (
              <img
                src={bookingData.itemImage}
                alt={bookingData.itemTitle}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{bookingData.itemTitle}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(bookingData.startDate)} - {formatDate(bookingData.endDate)}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ระยะเวลาเช่า</span>
              <span className="font-medium text-gray-900">{bookingData.totalDays} วัน</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ราคาต่อวัน</span>
              <span className="font-medium text-gray-900">{bookingData.dailyPrice.toLocaleString()} ฿</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">วิธีรับสินค้า</span>
              <span className="font-medium text-gray-900">
                {bookingData.deliveryMethod === 'pickup' ? 'รับเอง' : 'จัดส่ง'}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-3 space-y-2">
              {/* Rent */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ค่าเช่า ({bookingData.totalDays} วัน)</span>
                <span className="text-gray-900">{rentTotal.toLocaleString()} ฿</span>
              </div>
              {/* Delivery */}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ค่าจัดส่ง</span>
                  <span className="text-gray-900">{deliveryFee.toLocaleString()} ฿</span>
                </div>
              )}
              {/* Deposit — clearly separated */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  ค่ามัดจำ
                  <span className="text-xs text-green-600 font-medium">(คืนเต็มจำนวน)</span>
                </span>
                <span className="text-gray-900">{deposit.toLocaleString()} ฿</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-gray-300 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">ยอดรวมที่ต้องชำระ</span>
                <span className="text-xl font-bold text-primary">{grandTotal.toLocaleString()} ฿</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">รวมค่ามัดจำ {deposit.toLocaleString()} ฿ ที่จะคืนหลังจบการเช่า</p>
            </div>

            {/* GP Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 font-medium mb-1">ข้อมูลสำหรับเจ้าของสินค้า</p>
              <div className="flex justify-between text-xs text-amber-700">
                <span>ค่าเช่า</span>
                <span>{rentTotal.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-xs text-amber-700">
                <span>หัก GP แพลตฟอร์ม ({GP_PERCENT}%)</span>
                <span>- {gpFee.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-amber-900 border-t border-amber-300 mt-1 pt-1">
                <span>เจ้าของได้รับ</span>
                <span>{ownerReceives.toLocaleString()} ฿</span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                การจองจะถูกส่งไปยังเจ้าของสินค้า รอการยืนยันภายใน 24 ชั่วโมง
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังดำเนินการ...
                </>
              ) : (
                'ยืนยันการจอง'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
