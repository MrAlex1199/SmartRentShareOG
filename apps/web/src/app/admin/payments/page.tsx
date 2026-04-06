'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Payment {
  _id: string;
  amount: number;
  status: string;
  platformFeeAmount: number;
  ownerReceivesAmount: number;
  slipImageUrl?: string;
  createdAt: string;
  booking: {
    _id: string;
    status: string;
    renter: { _id: string; displayName: string; pictureUrl?: string };
    owner: { _id: string; displayName: string; pictureUrl?: string };
    item: { title: string; images: string[] };
  };
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  pending:   { label: 'รอตรวจสลิป', dot: 'bg-yellow-400', badge: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20' },
  verified:  { label: 'Verified',    dot: 'bg-blue-400',   badge: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  released:  { label: 'Released',    dot: 'bg-green-400',  badge: 'bg-green-400/15 text-green-400 border-green-400/20' },
  rejected:  { label: 'Rejected',    dot: 'bg-red-400',    badge: 'bg-red-400/15 text-red-400 border-red-400/20' },
  submitted: { label: 'ส่งสลิปแล้ว', dot: 'bg-orange-400', badge: 'bg-orange-400/15 text-orange-400 border-orange-400/20' },
};

const FILTERS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอตรวจ' },
  { key: 'submitted', label: 'มีสลิป' },
  { key: 'verified', label: 'Verified' },
  { key: 'released', label: 'Released' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState('verified');
  const [loading, setLoading] = useState(true);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [slipModal, setSlipModal] = useState<string | null>(null);

  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchPayments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments${filter ? `?status=${filter}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setPayments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleRelease = async (paymentId: string) => {
    if (!confirm('ยืนยันว่าโอนเงินให้เจ้าของแล้ว?')) return;
    setReleaseId(paymentId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/${paymentId}/release`,
        { method: 'PATCH', headers }
      );
      if (res.ok) await fetchPayments();
    } finally {
      setReleaseId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">💳 Payments</h1>
          <p className="text-sm text-gray-400 mt-1">จัดการการชำระเงินและ Release เงินให้เจ้าของ</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filter === f.key
                  ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-[#1E2130] rounded-2xl border border-white/5 p-16 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-400 font-medium">ไม่มี payment ตาม filter นี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={p._id}
                className="bg-[#1E2130] rounded-2xl border border-white/5 hover:border-white/10 transition-all p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Item thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                    {p.booking?.item?.images?.[0] ? (
                      <img src={p.booking.item.images[0]} alt={p.booking.item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(p.createdAt), { locale: th, addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-white font-semibold truncate">{p.booking?.item?.title ?? 'Payment'}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      ผู้เช่า: <span className="text-gray-300">{p.booking?.renter?.displayName}</span>
                      {' → '}
                      เจ้าของ: <span className="text-gray-300">{p.booking?.owner?.displayName}</span>
                    </p>

                    {/* Amount breakdown */}
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">ยอดรวม</p>
                        <p className="text-sm font-bold text-white">฿{p.amount?.toLocaleString()}</p>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <p className="text-xs text-gray-500">GP 10%</p>
                        <p className="text-sm font-bold text-yellow-400">฿{p.platformFeeAmount?.toLocaleString()}</p>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <p className="text-xs text-gray-500">เจ้าของได้รับ</p>
                        <p className="text-sm font-bold text-green-400">฿{p.ownerReceivesAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {p.slipImageUrl && (
                      <button
                        onClick={() => setSlipModal(p.slipImageUrl!)}
                        className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400/40 transition-all"
                      >
                        <img src={p.slipImageUrl} alt="slip" className="w-full h-full object-cover" />
                      </button>
                    )}
                    {p.status === 'verified' && (
                      <button
                        onClick={() => handleRelease(p._id)}
                        disabled={releaseId === p._id}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50 whitespace-nowrap transition-all"
                      >
                        {releaseId === p._id ? '...' : '💸 Release'}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/bookings/${p.booking?._id}`)}
                      className="px-3 py-1.5 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-xs hover:bg-white/10 hover:text-white whitespace-nowrap transition-all"
                    >
                      ดูการจอง
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slip Modal */}
      {slipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={() => setSlipModal(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSlipModal(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ปิด
            </button>
            <img src={slipModal} alt="payment slip" className="w-full rounded-2xl object-contain max-h-[80vh] shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
