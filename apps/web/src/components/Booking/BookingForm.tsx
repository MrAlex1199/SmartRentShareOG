'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { DeliveryMethod, CreateBookingDto } from '@repo/shared';
import { DateRangePicker } from './DateRangePicker';
import { differenceInDays } from 'date-fns';

interface BookingFormProps {
  itemId: string;
  dailyPrice: number;
  deposit: number;
  deliveryFee?: number;
  availableDeliveryMethods: DeliveryMethod[];
  onSubmit: (bookingData: CreateBookingDto) => Promise<void>;
}

export function BookingForm({
  itemId,
  dailyPrice,
  deposit,
  deliveryFee = 0,
  availableDeliveryMethods,
  onSubmit,
}: BookingFormProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    availableDeliveryMethods[0] || DeliveryMethod.PICKUP
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [bookedDates, setBookedDates] = useState<Array<{ startDate: Date; endDate: Date }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch booked dates
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/bookings/check-availability?itemId=${itemId}&startDate=${new Date().toISOString()}&endDate=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setBookedDates(data.bookedDates.map((d: any) => ({
            startDate: new Date(d.startDate),
            endDate: new Date(d.endDate),
          })));
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
      }
    };

    fetchAvailability();
  }, [itemId]);

  const calculateTotal = () => {
    if (!dateRange?.from || !dateRange?.to) return null;
    
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const rentalTotal = days * dailyPrice;
    const deliveryCost = deliveryMethod === DeliveryMethod.DELIVERY ? deliveryFee : 0;
    const total = rentalTotal + deliveryCost + deposit;
    
    return {
      days,
      rentalTotal,
      deliveryCost,
      deposit,
      total,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!dateRange?.from || !dateRange?.to) {
      setError('กรุณาเลือกวันที่เช่า');
      return;
    }

    if (deliveryMethod === DeliveryMethod.DELIVERY && !deliveryAddress) {
      setError('กรุณากรอกที่อยู่สำหรับจัดส่ง');
      return;
    }

    if (deliveryMethod === DeliveryMethod.PICKUP && !pickupLocation) {
      setError('กรุณากรอกสถานที่รับของ');
      return;
    }

    setLoading(true);

    try {
      const bookingData: CreateBookingDto = {
        item: itemId,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        deliveryMethod,
        deliveryAddress: deliveryMethod === DeliveryMethod.DELIVERY ? deliveryAddress : undefined,
        pickupLocation: deliveryMethod === DeliveryMethod.PICKUP ? pickupLocation : undefined,
      };

      await onSubmit(bookingData);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Range Picker */}
      <DateRangePicker
        bookedDates={bookedDates}
        onDateChange={setDateRange}
        selectedRange={dateRange}
        dailyPrice={dailyPrice}
      />

      {/* Delivery Method */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">วิธีรับของ</h3>
        
        <div className="space-y-3">
          {availableDeliveryMethods.includes(DeliveryMethod.PICKUP) && (
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="deliveryMethod"
                value={DeliveryMethod.PICKUP}
                checked={deliveryMethod === DeliveryMethod.PICKUP}
                onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">รับเองที่จุดนัดหมาย</div>
                <div className="text-sm text-gray-600">ไม่มีค่าใช้จ่ายเพิ่มเติม</div>
              </div>
            </label>
          )}

          {availableDeliveryMethods.includes(DeliveryMethod.DELIVERY) && (
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="deliveryMethod"
                value={DeliveryMethod.DELIVERY}
                checked={deliveryMethod === DeliveryMethod.DELIVERY}
                onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">จัดส่งถึงที่</div>
                <div className="text-sm text-gray-600">
                  ค่าจัดส่ง ฿{deliveryFee.toLocaleString()}
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Delivery Address Input */}
        {deliveryMethod === DeliveryMethod.DELIVERY && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ที่อยู่สำหรับจัดส่ง
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="กรอกที่อยู่สำหรับจัดส่ง..."
              required
            />
          </div>
        )}

        {/* Pickup Location Input */}
        {deliveryMethod === DeliveryMethod.PICKUP && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานที่นัดรับของ
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="เช่น หอพัก A ชั้น 1"
              required
            />
          </div>
        )}
      </div>

      {/* Price Summary */}
      {totals && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปราคา</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ค่าเช่า ({totals.days} วัน × ฿{dailyPrice.toLocaleString()})</span>
              <span className="font-medium text-gray-900">฿{totals.rentalTotal.toLocaleString()}</span>
            </div>
            
            {totals.deliveryCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">ค่าจัดส่ง</span>
                <span className="font-medium text-gray-900">฿{totals.deliveryCost.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">มัดจำ</span>
              <span className="font-medium text-gray-900">฿{totals.deposit.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-900 font-semibold text-base">ยอดรวมทั้งหมด</span>
              <span className="text-2xl font-bold text-primary">
                ฿{totals.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !dateRange?.from || !dateRange?.to}
        className="w-full px-6 py-3 bg-primary text-gray-900 font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอจอง'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        เจ้าของจะต้องยืนยันคำขอจองของคุณก่อน
      </p>
    </form>
  );
}
