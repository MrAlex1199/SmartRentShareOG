'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Booking, BookingStatus } from '@repo/shared';
import { BookingCard } from '@/components/Booking/BookingCard';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';

interface PaginatedResponse {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusFilters = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รอยืนยัน' },
  { value: 'confirmed', label: 'ยืนยันแล้ว' },
  { value: 'paid', label: 'ดำเนินการอยู่' },
  { value: 'active', label: 'กำลังเช่า' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'rejected', label: 'ปฏิเสธ' },
  { value: 'cancelled', label: 'ยกเลิก' },
];

export default function BookingRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States
  const [filter, setFilter] = useState(searchParams?.get('status') || 'all');
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1);
  const limit = 10;

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchBookings(page, filter);
  }, [page, filter]);

  const fetchBookings = async (p: number, s: string) => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/bookings/my-requests`);
      url.searchParams.append('page', p.toString());
      url.searchParams.append('limit', limit.toString());
      if (s !== 'all') {
        url.searchParams.append('status', s);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        // Fallback for legacy structure where array is returned directly
        if (Array.isArray(result)) {
          setData({
            data: result,
            total: result.length,
            page: 1,
            limit: 100,
            totalPages: 1
          });
        } else {
          setData(result);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
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

      if (response.ok) {
        fetchBookings(page, filter);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleFilterChange = (newStatus: string) => {
    setFilter(newStatus);
    setPage(1); // Reset to first page
    router.replace(`/bookings/requests?status=${newStatus}&page=1`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.replace(`/bookings/requests?status=${filter}&page=${newPage}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bookings = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">คำขอจอง</h1>
            <p className="text-sm text-gray-500">จัดการคำขอจองสำหรับสินค้าของคุณ</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm inline-flex items-center gap-2">
            <span className="text-gray-500 text-sm">ทั้งหมด</span>
            <span className="text-xl font-bold text-gray-900">{totalItems}</span>
            <span className="text-gray-500 text-sm">รายการ</span>
          </div>
        </div>

        {/* Scrollable Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.value
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <div className="text-5xl mb-4 opacity-50">📂</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">ไม่พบข้อมูล</p>
            <p className="text-sm text-gray-500">ไม่มีคำขอจองในสถานะนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                viewType="owner"
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                    page === p
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

