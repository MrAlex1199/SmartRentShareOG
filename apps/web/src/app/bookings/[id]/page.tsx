'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Booking, BookingStatus } from '@repo/shared';
import { Header } from '@/components/Layout/Header';
import { BookingStatusBadge } from '@/components/Booking/BookingStatusBadge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Cookies from 'js-cookie';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const token = Cookies.get('token');
      console.log('Fetching booking:', bookingId);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'ไม่พบข้อมูลการจอง');
      }

      const data = await response.json();
      console.log('Booking data:', data);
      setBooking(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    if (!booking) return;

    setActionLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('ไม่สามารถอัพเดทสถานะได้');
      }

      // Refresh booking data
      await fetchBooking();
      alert('อัพเดทสถานะสำเร็จ');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?')) {
      return;
    }

    setActionLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('ไม่สามารถยกเลิกการจองได้');
      }

      alert('ยกเลิกการจองสำเร็จ');
      router.push('/bookings');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h2>
            <p className="text-gray-600 mb-6">{error || 'การจองที่คุณกำลังมองหาไม่มีอยู่ในระบบ'}</p>
            <button
              onClick={() => router.push('/bookings')}
              className="px-6 py-2.5 bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              กลับไปหน้าการจอง
            </button>
          </div>
        </div>
      </div>
    );
  }

  const item = typeof booking.item === 'object' ? booking.item : null;
  const renter = typeof booking.renter === 'object' ? booking.renter : null;
  const owner = typeof booking.owner === 'object' ? booking.owner : null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMMM yyyy', { locale: th });
  };

  const grandTotal = booking.totalPrice + (booking.deliveryFee || 0) + (item?.deposit || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ย้อนกลับ
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">รายละเอียดการจอง</h1>
              <p className="text-sm text-gray-600">รหัสการจอง: {booking._id}</p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>

        {/* Item Information */}
        {item && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลสินค้า</h2>
            <div className="flex gap-4">
              {item.images && item.images.length > 0 && (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-2">{item.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {item.location?.area}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดการเช่า</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">วันที่เริ่มเช่า</span>
              <span className="font-medium text-gray-900">{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">วันที่สิ้นสุด</span>
              <span className="font-medium text-gray-900">{formatDate(booking.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">จำนวนวัน</span>
              <span className="font-medium text-gray-900">{booking.totalDays} วัน</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">วิธีรับสินค้า</span>
              <span className="font-medium text-gray-900">
                {booking.deliveryMethod === 'pickup' ? 'รับเอง' : 'จัดส่ง'}
              </span>
            </div>
            {booking.deliveryAddress && (
              <div className="flex justify-between">
                <span className="text-gray-600">ที่อยู่จัดส่ง</span>
                <span className="font-medium text-gray-900 text-right max-w-md">{booking.deliveryAddress}</span>
              </div>
            )}
            {booking.pickupLocation && (
              <div className="flex justify-between">
                <span className="text-gray-600">สถานที่นัดรับ</span>
                <span className="font-medium text-gray-900">{booking.pickupLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดราคา</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ค่าเช่า ({booking.totalDays} วัน × ฿{item?.dailyPrice.toLocaleString()})</span>
              <span className="text-gray-900">฿{booking.totalPrice.toLocaleString()}</span>
            </div>
            {booking.deliveryFee && booking.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ค่าจัดส่ง</span>
                <span className="text-gray-900">฿{booking.deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ค่ามัดจำ</span>
              <span className="text-gray-900">฿{(item?.deposit || 0).toLocaleString()}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">ยอดรวมทั้งหมด</span>
                <span className="text-2xl font-bold text-primary">฿{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลผู้ใช้</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renter && (
              <div>
                <p className="text-sm text-gray-600 mb-2">ผู้เช่า</p>
                <div className="flex items-center gap-3">
                  {renter.pictureUrl ? (
                    <img src={renter.pictureUrl} alt={renter.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{renter.displayName.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{renter.displayName}</span>
                </div>
              </div>
            )}
            {owner && (
              <div>
                <p className="text-sm text-gray-600 mb-2">เจ้าของ</p>
                <div className="flex items-center gap-3">
                  {owner.pictureUrl ? (
                    <img src={owner.pictureUrl} alt={owner.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{owner.displayName.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{owner.displayName}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-3">
            {booking.status === BookingStatus.PENDING && (
              <>
                <button
                  onClick={() => handleStatusUpdate(BookingStatus.CONFIRMED)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยืนยันการจอง
                </button>
                <button
                  onClick={() => handleStatusUpdate(BookingStatus.REJECTED)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ปฏิเสธการจอง
                </button>
              </>
            )}
            {[BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status) && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิกการจอง
              </button>
            )}
            <button
              onClick={() => router.push('/bookings')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              กลับไปหน้าการจอง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
