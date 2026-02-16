'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Item, CreateBookingDto, DeliveryMethod } from '@repo/shared';
import { Header } from '@/components/Layout/Header';
import { ImageGallery } from '@/components/ImageGallery';
import { BookingForm } from '@/components/Booking/BookingForm';
import { BookingConfirmationModal } from '@/components/Booking/BookingConfirmationModal';
import Cookies from 'js-cookie';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Booking confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<CreateBookingDto | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    setIsAuthenticated(!!token);
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${itemId}`);
      if (!response.ok) {
        throw new Error('ไม่พบสินค้า');
      }
      const data = await response.json();
      setItem(data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (bookingData: CreateBookingDto) => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบก่อนทำการจอง');
      return;
    }

    // Store booking data and show confirmation modal
    setPendingBooking(bookingData);
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingBooking || !item) return;

    setBookingLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pendingBooking),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ไม่สามารถสร้างการจองได้');
      }

      // Success
      setShowConfirmation(false);
      alert('จองสำเร็จ! รอเจ้าของยืนยันภายใน 24 ชั่วโมง');
      router.push('/bookings');
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setBookingLoading(false);
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

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบสินค้า</h2>
            <p className="text-gray-600 mb-6">{error || 'สินค้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calculateBookingData = () => {
    if (!pendingBooking || !item) return null;

    const startDate = new Date(pendingBooking.startDate);
    const endDate = new Date(pendingBooking.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = item.dailyPrice * totalDays;
    const deliveryFee = pendingBooking.deliveryMethod === DeliveryMethod.DELIVERY ? (item.deliveryFee || 0) : 0;

    return {
      itemTitle: item.title,
      itemImage: item.images?.[0],
      startDate: pendingBooking.startDate,
      endDate: pendingBooking.endDate,
      totalDays,
      dailyPrice: item.dailyPrice,
      totalPrice,
      deposit: item.deposit,
      deliveryMethod: pendingBooking.deliveryMethod,
      deliveryFee,
    };
  };

  const bookingData = calculateBookingData();
  const ownerName = typeof item.owner === 'object' ? item.owner.displayName : 'Unknown';
  const ownerPicture = typeof item.owner === 'object' ? item.owner.pictureUrl : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={item.images || []} title={item.title} />

            {/* Item Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* Title and Category */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {item.category}
                  </span>
                  {item.condition && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                      {item.condition}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">รายละเอียด</h2>
                <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ราคา</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">รายวัน</p>
                    <p className="text-2xl font-bold text-primary">{item.dailyPrice.toLocaleString()} ฿</p>
                  </div>
                  {item.weeklyPrice && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">รายสัปดาห์</p>
                      <p className="text-2xl font-bold text-gray-900">{item.weeklyPrice.toLocaleString()} ฿</p>
                    </div>
                  )}
                  {item.monthlyPrice && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">รายเดือน</p>
                      <p className="text-2xl font-bold text-gray-900">{item.monthlyPrice.toLocaleString()} ฿</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  ค่ามัดจำ: <span className="font-semibold text-gray-900">{item.deposit.toLocaleString()} ฿</span>
                </div>
              </div>

              {/* Location */}
              {item.location && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานที่</h2>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{item.location.university}</p>
                      {item.location.building && (
                        <p className="text-sm text-gray-600">{item.location.building}</p>
                      )}
                      <p className="text-sm text-gray-600">{item.location.area}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Options */}
              {item.deliveryOptions && item.deliveryOptions.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">วิธีรับสินค้า</h2>
                  <div className="flex flex-wrap gap-2">
                    {item.deliveryOptions.includes('pickup') && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">รับเอง</span>
                      </div>
                    )}
                    {item.deliveryOptions.includes('delivery') && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          จัดส่ง {item.deliveryFee && item.deliveryFee > 0 ? `(${item.deliveryFee} ฿)` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Owner */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">เจ้าของ</h2>
                <div className="flex items-center gap-3">
                  {ownerPicture ? (
                    <img 
                      src={ownerPicture} 
                      alt={ownerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">
                        {ownerName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{ownerName}</p>
                    <p className="text-sm text-gray-500">เจ้าของสินค้า</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BookingForm
                itemId={itemId}
                dailyPrice={item.dailyPrice}
                deposit={item.deposit}
                deliveryFee={item.deliveryFee}
                availableDeliveryMethods={(item.deliveryOptions || []) as DeliveryMethod[]}
                onSubmit={handleBookingSubmit}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showConfirmation && bookingData && (
        <BookingConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmBooking}
          bookingData={bookingData}
          loading={bookingLoading}
        />
      )}
    </div>
  );
}
