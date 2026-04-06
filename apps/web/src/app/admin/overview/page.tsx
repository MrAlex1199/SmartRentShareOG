'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Stats {
  payments: { total: number; pending: number; verified: number; released: number };
  bookings: { total: number };
  financials: { totalGPCollected: number; totalPayoutSent: number; pendingPayout: number; pendingGP: number };
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  booking: {
    renter: { displayName: string };
    owner: { displayName: string };
    item: { title: string };
  };
}

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string; icon: string; accent: string;
}) {
  return (
    <div className={`bg-[#1E2130] rounded-2xl p-6 border border-white/5 hover:border-${accent}-400/30 transition-all group`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={`w-10 h-10 rounded-xl bg-${accent}-400/10 flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function ActivityItem({ payment }: { payment: Payment }) {
  const statusMap: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: 'รอตรวจสลิป', color: 'text-yellow-400', dot: 'bg-yellow-400' },
    verified: { label: 'Verified', color: 'text-blue-400', dot: 'bg-blue-400' },
    released: { label: 'Released', color: 'text-green-400', dot: 'bg-green-400' },
    rejected: { label: 'Rejected', color: 'text-red-400', dot: 'bg-red-400' },
  };
  const s = statusMap[payment.status] ?? { label: payment.status, color: 'text-gray-400', dot: 'bg-gray-400' };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{payment.booking?.item?.title ?? 'Payment'}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {payment.booking?.renter?.displayName} → {payment.booking?.owner?.displayName}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-medium ${s.color}`}>{s.label}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {formatDistanceToNow(new Date(payment.createdAt), { locale: th, addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const token = Cookies.get('token');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/payments?limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (paymentsRes.ok) setRecentPayments(await paymentsRes.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      </div>
    );
  }

  const statCards = [
    { label: 'Bookings ทั้งหมด', value: stats?.bookings.total ?? 0, icon: '📋', accent: 'blue', sub: 'การจองสะสม' },
    { label: 'Payments รอตรวจสลิป', value: stats?.payments.pending ?? 0, icon: '⏳', accent: 'yellow', sub: 'ต้องตรวจโดยเร็ว' },
    { label: 'GP สะสม (released)', value: `฿${(stats?.financials.totalGPCollected ?? 0).toLocaleString()}`, icon: '💰', accent: 'green', sub: 'รายได้แพลตฟอร์ม' },
    { label: 'Payout รอโอน', value: `฿${(stats?.financials.pendingPayout ?? 0).toLocaleString()}`, icon: '📤', accent: 'orange', sub: 'ยอดที่ต้องโอนให้เจ้าของ' },
  ];

  const quickActions = [
    { label: 'ตรวจสอบ Payments', href: '/admin/payments', icon: '💳', desc: `${stats?.payments.verified ?? 0} รายการรอ Release` },
    { label: 'ตรวจสอบบัตร', href: '/admin/verifications', icon: '🪪', desc: 'ยืนยันตัวตนผู้ใช้' },
    { label: 'จัดการผู้ใช้', href: '/admin/users', icon: '👥', desc: 'Ban / เปลี่ยน Role' },
    { label: 'Disputes', href: '/admin/disputes', icon: '⚠️', desc: 'ข้อพิพาทระหว่างผู้ใช้' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">ภาพรวมแพลตฟอร์ม</h1>
        <p className="text-sm text-gray-400 mt-1">SmartRent&amp;Share — ข้อมูลล่าสุด</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-white">Quick Actions</h2>
          {quickActions.map(a => (
            <button
              key={a.href}
              onClick={() => router.push(a.href)}
              className="w-full flex items-center gap-4 p-4 bg-[#1E2130] rounded-xl border border-white/5 hover:border-yellow-400/30 hover:bg-[#252837] transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {a.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{a.label}</p>
                <p className="text-xs text-gray-500 truncate">{a.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}

          {/* Manual Escrow reminder */}
          <div className="p-4 bg-blue-400/5 border border-blue-400/20 rounded-xl mt-4">
            <p className="text-blue-400 text-sm font-semibold mb-1">💡 Manual Escrow Flow</p>
            <ol className="text-xs text-blue-300/70 space-y-1 list-decimal list-inside">
              <li>ผู้เช่าโอนเงิน → ส่งสลิป</li>
              <li>ตรวจสลิป → Verify</li>
              <li>เช่าเสร็จ → Release เงินให้เจ้าของ</li>
            </ol>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">กิจกรรมล่าสุด</h2>
            <button onClick={() => router.push('/admin/payments')} className="text-xs text-yellow-400 hover:text-yellow-300">
              ดูทั้งหมด →
            </button>
          </div>
          <div className="bg-[#1E2130] rounded-2xl border border-white/5 p-5">
            {recentPayments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-gray-500 text-sm">ยังไม่มีกิจกรรม</p>
              </div>
            ) : (
              <div>
                {recentPayments.map(p => (
                  <ActivityItem key={p._id} payment={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
