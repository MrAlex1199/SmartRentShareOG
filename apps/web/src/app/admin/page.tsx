'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';

/* ─── Types ─── */
interface Stats {
  payments: { total: number; pending: number; verified: number; released: number };
  bookings: { total: number };
  financials: { totalGPCollected: number; totalPayoutSent: number; pendingPayout: number; pendingGP: number };
}

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

/* ─── Helpers ─── */
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl border ${color} p-5`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
    released: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const label: Record<string, string> = {
    pending: '⏳ รอตรวจสอบ',
    verified: '✅ Verified',
    released: '💸 Released',
    rejected: '❌ Rejected',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>{label[status] ?? status}</span>;
}

type Tab = 'overview' | 'payments' | 'verifications' | 'users';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterStatus, setFilterStatus] = useState('verified'); // default: needs releasing
  const [loading, setLoading] = useState(true);
  const [releaseLoading, setReleaseLoading] = useState<string | null>(null);
  const [slipModal, setSlipModal] = useState<string | null>(null);

  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments?status=${filterStatus}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.status === 403) { router.push('/'); return; }
      if (statsRes.ok) setStats(await statsRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRelease = async (paymentId: string) => {
    if (!confirm('ยืนยันว่าโอนเงินให้เจ้าของแล้ว?')) return;
    setReleaseLoading(paymentId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments/${paymentId}/release`, { method: 'PATCH', headers });
      await fetchData();
    } finally {
      setReleaseLoading(null);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: '📊 ภาพรวม' },
    { key: 'payments', label: '💰 Payments' },
    { key: 'verifications', label: '🪪 Verify ตัวตน' },
    { key: 'users', label: '👥 Users' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👑 Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">จัดการแพลตฟอร์ม SmartRentShare</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => router.push('/admin/verifications')}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              🪪 ตรวจสอบบัตร
            </button>
            <button onClick={() => router.push('/admin/disputes')}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              ⚠️ Disputes
            </button>
            <button onClick={() => router.push('/admin/users')}
              className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
              👥 Users
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Bookings ทั้งหมด" value={stats.bookings.total} color="border-gray-200" />
              <StatCard label="Payments รอตรวจ" value={stats.payments.pending} color="border-yellow-200" />
              <StatCard label="รอ Payout" value={stats.payments.verified} sub="Verified แล้ว ยังไม่โอน" color="border-blue-200" />
              <StatCard label="Released แล้ว" value={stats.payments.released} color="border-green-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="GP สะสม (released)" value={`฿${stats.financials.totalGPCollected.toLocaleString()}`} color="border-primary" />
              <StatCard label="Payout รอโอน" value={`฿${stats.financials.pendingPayout.toLocaleString()}`} sub="ยอดที่ต้องโอนให้เจ้าของ" color="border-orange-200" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 วิธีใช้งาน Manual Escrow</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>ผู้เช่าโอนเงินเข้าบัญชีของคุณ (0625783770) แล้วส่ง slip</li>
                <li>ตรวจสลิปในหน้า Booking → กด "Verify" → สถานะเป็น verified</li>
                <li>หลัง rental เสร็จ → กด "Release" ในหน้า Payments → โอนเงินให้เจ้าของ</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Tab: Payments ── */}
        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'verified', 'released', 'rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s === 'all' ? '' : s)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterStatus === (s === 'all' ? '' : s) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {s === 'all' ? 'ทั้งหมด' : s}
                </button>
              ))}
            </div>

            {payments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-4xl mb-3">💰</p>
                <p className="text-gray-500">ไม่มี payment ตาม filter นี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p._id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusBadge status={p.status} />
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(p.createdAt), { locale: th, addSuffix: true })}
                          </span>
                        </div>

                        {p.booking && (
                          <div className="text-sm text-gray-700 mb-3">
                            <p className="font-medium text-gray-900 truncate">{p.booking.item?.title}</p>
                            <p className="text-gray-500 mt-0.5">
                              ผู้เช่า: {p.booking.renter?.displayName} →
                              เจ้าของ: {p.booking.owner?.displayName}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">ยอดรวม</p>
                            <p className="font-bold text-gray-900">฿{p.amount.toLocaleString()}</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">GP 10%</p>
                            <p className="font-bold text-yellow-700">฿{p.platformFeeAmount?.toLocaleString()}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-xs text-gray-500">เจ้าของได้รับ</p>
                            <p className="font-bold text-green-700">฿{p.ownerReceivesAmount?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Slip thumbnail + actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {p.slipImageUrl && (
                          <button onClick={() => setSlipModal(p.slipImageUrl!)}
                            className="relative overflow-hidden rounded-lg border border-gray-200 hover:opacity-90 transition-opacity">
                            <img src={p.slipImageUrl} alt="slip" className="w-16 h-16 object-cover" />
                          </button>
                        )}

                        {p.status === 'verified' && (
                          <button
                            onClick={() => handleRelease(p._id)}
                            disabled={releaseLoading === p._id}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {releaseLoading === p._id ? '...' : '💸 Release (โอนแล้ว)'}
                          </button>
                        )}

                        <button onClick={() => router.push(`/bookings/${p.booking?._id}`)}
                          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                          ดูการจอง
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Verifications (redirect) ── */}
        {tab === 'verifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
            <p className="text-4xl">🪪</p>
            <p className="font-medium text-gray-900">ตรวจสอบบัตรนักศึกษา / บัตรประชาชน</p>
            <button onClick={() => router.push('/admin/verifications')}
              className="px-6 py-2.5 bg-primary text-gray-900 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              ไปหน้าตรวจสอบบัตร →
            </button>
          </div>
        )}

        {/* ── Tab: Users (redirect) ── */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
            <p className="text-4xl">👥</p>
            <p className="font-medium text-gray-900">จัดการสมาชิกผู้ใช้งานบนแพลตฟอร์ม</p>
            <p className="text-sm text-gray-500">ดูรายชื่อ ค้นหา แบน / ปลดแบน และกำหนด Role</p>
            <button onClick={() => router.push('/admin/users')}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors">
              ไปหน้าจัดการผู้ใช้ →
            </button>
          </div>
        )}
      </div>

      {/* ── Slip Modal ── */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={() => setSlipModal(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSlipModal(null)} className="absolute -top-10 right-0 text-white text-sm hover:underline">✕ ปิด</button>
            <img src={slipModal} alt="payment slip" className="w-full rounded-xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
