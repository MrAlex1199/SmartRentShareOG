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

const statusLabel: Record<string, { text: string; bg: string; textC: string; icon: React.ReactNode }> = {
  pending:   { text: 'รอการชำระ',    bg: 'bg-gray-100', textC: 'text-gray-700', icon: '⏳' },
  submitted: { text: 'รอยืนยันสลิป', bg: 'bg-yellow-100', textC: 'text-yellow-700', icon: '📤' },
  verified:  { text: 'เงินอยู่ในระบบ', bg: 'bg-blue-100', textC: 'text-blue-700', icon: '🔒' },
  rejected:  { text: 'ปฏิเสธสลิป',  bg: 'bg-red-100', textC: 'text-red-700', icon: '❌' },
  released:  { text: 'โอนเงินแล้ว', bg: 'bg-green-100', textC: 'text-green-700', icon: '💸' },
};

function fmt(d: string) {
  return format(new Date(d), 'd MMM yy', { locale: th });
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

  // สรุปยอดเงิน
  const totalGross = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalFees = payouts.reduce((sum, p) => sum + (p.platformFeeAmount || 0), 0);
  
  const totalReleased = payouts
    .filter(p => p.status === 'released')
    .reduce((sum, p) => sum + (p.ownerReceivesAmount || 0), 0);

  const totalPending = payouts
    .filter(p => ['submitted', 'verified'].includes(p.status))
    .reduce((sum, p) => sum + (p.ownerReceivesAmount || 0), 0);

  // คำนวณความคืบหน้าของเงินที่ได้รับ
  const netTotal = totalReleased + totalPending;
  const progressPercent = netTotal > 0 ? (totalReleased / netTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header Title */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">กระเป๋าเงินและรายได้</h1>
            <p className="text-sm text-gray-500 mt-1">ประวัติการรับเงินจากการให้เช่าสินค้า</p>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1: รับสุทธิแล้ว */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91 2.95.73 4.18 2 4.18 3.92-.01 2.19-1.62 3.15-3.12 3.15z"/></svg>
            </div>
            <p className="text-green-100 font-medium text-sm mb-1">ยอดเงินที่โอนสำเร็จแล้ว</p>
            <h2 className="text-3xl font-bold mb-4">฿{totalReleased.toLocaleString()}</h2>
            <div className="flex items-center gap-2 text-xs bg-black/10 px-3 py-1.5 rounded-full inline-flex">
              <span className="font-semibold">{payouts.filter(p => p.status === 'released').length}</span> รายการที่สำเร็จ
            </div>
          </div>

          {/* Card 2: รอโอน */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-500 font-medium text-sm">ยอดเงินรอรับ (ในระบบ)</p>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">🔒</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">฿{totalPending.toLocaleString()}</h2>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>อัตราการได้รับเงิน</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">รายละเอียดรายได้ทั้งหมด</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">ยอดรวมค่าเช่า (Gross)</span>
              <span className="font-medium text-gray-900">฿{totalGross.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-400">หักค่าบริการแพลตฟอร์ม</span>
              <span className="font-medium text-red-500">- ฿{totalFees.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-900 font-semibold text-sm">รายได้สุทธิ (Net)</span>
              <span className="font-bold text-gray-900 text-base">฿{(totalGross - totalFees).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'released', 'verified', 'submitted'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === f ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'ทั้งหมด' : statusLabel[f]?.text}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                {f === 'all' ? payouts.length : payouts.filter(p => p.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
            <div className="text-5xl mb-4 opacity-50">📭</div>
            <p className="text-gray-500 font-medium">ไม่มีรายการรับเงินในสถานะนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => {
              const s = statusLabel[p.status] ?? statusLabel.pending;
              const item = p.booking?.item;
              const renter = p.booking?.renter;
              return (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  onClick={() => router.push(`/bookings/${p.booking._id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Left: Item Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                        {item?.images?.[0] ? (
                          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900 mb-0.5 line-clamp-1">{item?.title ?? 'สินค้า'}</p>
                        <p className="text-sm text-gray-500 mb-1.5 flex items-center gap-1">
                          👤 {renter?.displayName ?? 'ผู้เช่า'}
                        </p>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.textC}`}>
                          <span>{s.icon}</span> {s.text}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amounts & Dates */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 mt-2 sm:mt-0 gap-4 sm:gap-1">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500 mb-0.5">รับสุทธิ (หัก GP {p.platformFeePercent || 10}%)</p>
                        <p className="text-lg font-bold text-green-600">฿{(p.ownerReceivesAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {p.status === 'released' ? 'โอนเมื่อ ' : 'อัปเดตเมื่อ '}
                          {fmt(p.escrowReleasedAt || p.createdAt)}
                        </p>
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

