'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface PayoutItem {
  _id: string;
  amount: number;
  platformFeeAmount: number;
  ownerReceivesAmount: number;
  platformFeePercent: number;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'released';
  createdAt: string;
  submittedAt?: string;
  escrowReleasedAt?: string;
  booking: {
    _id: string;
    status: string;
    startDate: string;
    endDate: string;
    item: { title: string; images: string[] };
    renter: { displayName: string; pictureUrl?: string };
  };
}

const statusLabel: Record<string, { text: string; color: string; emoji: string }> = {
  pending:   { text: 'รอการชำระ',    color: 'bg-gray-100 text-gray-600',    emoji: '⏳' },
  submitted: { text: 'รอยืนยันสลิป', color: 'bg-yellow-100 text-yellow-700', emoji: '📤' },
  verified:  { text: 'ยืนยันแล้ว',   color: 'bg-blue-100 text-blue-700',    emoji: '✅' },
  rejected:  { text: 'ปฏิเสธสลิป',  color: 'bg-red-100 text-red-600',      emoji: '❌' },
  released:  { text: 'โอนเงินแล้ว', color: 'bg-green-100 text-green-700',  emoji: '💸' },
};

function fmt(d: string) {
  return format(new Date(d), 'd MMM yyyy', { locale: th });
}

export default function PayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'released' | 'verified' | 'submitted'>('all');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { router.push('/'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/my-payouts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setPayouts)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = payouts.filter(p => filter === 'all' || p.status === filter);

  const totalReleased = payouts
    .filter(p => p.status === 'released')
    .reduce((sum, p) => sum + (p.ownerReceivesAmount || 0), 0);

  const totalPending = payouts
    .filter(p => ['submitted', 'verified'].includes(p.status))
    .reduce((sum, p) => sum + (p.ownerReceivesAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-sm text-gray-500 mb-2 hover:text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ย้อนกลับ Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💸 รายการรับเงิน</h1>
          <p className="text-sm text-gray-500 mt-1">ประวัติการรับเงินจากการให้เช่าสินค้า</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">รับแล้วทั้งหมด</p>
            <p className="text-xl font-bold text-green-600">฿{totalReleased.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">รอรับอยู่</p>
            <p className="text-xl font-bold text-blue-600">฿{totalPending.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {(['all', 'released', 'verified', 'submitted'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-gray-900' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'ทั้งหมด' : statusLabel[f]?.text}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-gray-500">ยังไม่มีรายการรับเงิน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const s = statusLabel[p.status] ?? statusLabel.pending;
              const item = p.booking?.item;
              const renter = p.booking?.renter;
              return (
                <div
                  key={p._id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => router.push(`/bookings/${p.booking._id}`)}
                >
                  <div className="flex items-start gap-3">
                    {/* Item image */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {item?.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item?.title ?? 'สินค้า'}</p>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                          {s.emoji} {s.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">ผู้เช่า: {renter?.displayName ?? '-'}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-400">ยอดรับเงิน</p>
                          <p className="text-sm font-bold text-green-600">฿{(p.ownerReceivesAmount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">GP {p.platformFeePercent || 10}%</p>
                          <p className="text-sm font-medium text-red-500">-฿{(p.platformFeeAmount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">วันที่</p>
                          <p className="text-xs font-medium text-gray-700">{fmt(p.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
