'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface Dispute {
  _id: string;
  reason: string;
  description: string;
  status: string;
  evidence: string[];
  createdAt: string;
  resolution?: string;
  reporter: { _id: string; displayName: string; pictureUrl?: string };
  reportedUser: { _id: string; displayName: string; pictureUrl?: string };
  booking: { _id: string; status: string };
}

const REASON_LABELS: Record<string, string> = {
  item_damaged: '💥 สินค้าเสียหาย',
  item_not_as_described: '📋 ไม่ตรงตามที่โฆษณา',
  no_show: '🚷 ไม่มาตามนัด',
  late_return: '⏰ คืนช้า',
  payment_issue: '💳 ปัญหาการชำระเงิน',
  other: '❓ อื่นๆ',
};

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filterStatus, setFilterStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss'>('resolve');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const token = Cookies.get('token');

  const fetchDisputes = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/disputes${filterStatus ? `?status=${filterStatus}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.status === 403) { router.push('/'); return; }
      if (res.ok) setDisputes(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, router]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleResolve = async () => {
    if (!resolveModal || !resolution) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/disputes/${resolveModal._id}/resolve`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: resolveAction, resolution }),
        },
      );
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.message || 'Error'); return; }
      setResolveModal(null);
      setResolution('');
      await fetchDisputes();
    } finally {
      setActionLoading(false);
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚠️ Dispute Management</h1>
            <p className="text-sm text-gray-500 mt-1">{disputes.length} รายการ</p>
          </div>
          <button onClick={() => router.push('/admin')} className="text-sm text-gray-500 hover:text-gray-700">← Admin</button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['open', 'reviewing', 'resolved', 'dismissed', ''].map((s, i) => (
            <button key={i} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {s === '' ? 'ทั้งหมด' : s}
            </button>
          ))}
        </div>

        {disputes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-500">ไม่มี dispute ในตอนนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map(d => (
              <div key={d._id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                      <span className="text-sm font-medium text-gray-900">{REASON_LABELS[d.reason] ?? d.reason}</span>
                      <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(d.createdAt), { locale: th, addSuffix: true })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>ผู้รายงาน: <b>{d.reporter?.displayName}</b></span>
                      <span>→</span>
                      <span>ผู้ถูกรายงาน: <b>{d.reportedUser?.displayName}</b></span>
                    </div>

                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed mb-2">{d.description}</p>

                    {/* Evidence */}
                    {d.evidence?.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {d.evidence.map((url, i) => (
                          <button key={i} onClick={() => setSelectedEvidence(url)}
                            className="rounded-lg overflow-hidden border border-gray-200 hover:opacity-90">
                            <img src={url} alt={`evidence ${i + 1}`} className="w-14 h-14 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resolution */}
                    {d.resolution && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                        <span className="font-medium">การตัดสิน: </span>{d.resolution}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => router.push(`/bookings/${d.booking?._id}`)}
                      className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap">
                      ดูการจอง
                    </button>
                    {['open', 'reviewing'].includes(d.status) && (
                      <button
                        onClick={() => { setResolveModal(d); setResolution(''); setResolveAction('resolve'); }}
                        className="px-3 py-1.5 text-xs bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary/90 whitespace-nowrap"
                      >
                        ⚖️ ตัดสิน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Evidence Modal ── */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={() => setSelectedEvidence(null)}>
          <div onClick={e => e.stopPropagation()} className="relative max-w-lg w-full">
            <button onClick={() => setSelectedEvidence(null)} className="absolute -top-10 right-0 text-white text-sm">✕ ปิด</button>
            <img src={selectedEvidence} alt="evidence" className="w-full rounded-xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {/* ── Resolve Modal ── */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">⚖️ ตัดสิน Dispute</h3>
            <p className="text-sm text-gray-600">{REASON_LABELS[resolveModal.reason]} — {resolveModal.reporter?.displayName}</p>

            <div className="grid grid-cols-2 gap-2">
              {(['resolve', 'dismiss'] as const).map(a => (
                <button key={a} onClick={() => setResolveAction(a)}
                  className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${resolveAction === a ? (a === 'resolve' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-400 bg-gray-100 text-gray-700') : 'border-gray-200 text-gray-500'}`}>
                  {a === 'resolve' ? '✅ Resolved (มีผล)' : '🚫 Dismissed (ยกเลิก)'}
                </button>
              ))}
            </div>

            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder="คำอธิบายการตัดสินใจ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex gap-3">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleResolve} disabled={!resolution || actionLoading}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-gray-800">
                {actionLoading ? '...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
