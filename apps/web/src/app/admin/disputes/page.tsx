'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  open:      { label: 'Open',      badge: 'bg-red-400/15 text-red-400 border-red-400/20',       dot: 'bg-red-400' },
  reviewing: { label: 'Reviewing', badge: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', dot: 'bg-yellow-400' },
  resolved:  { label: 'Resolved',  badge: 'bg-green-400/15 text-green-400 border-green-400/20',  dot: 'bg-green-400' },
  dismissed: { label: 'Dismissed', badge: 'bg-gray-400/15 text-gray-400 border-gray-400/20',    dot: 'bg-gray-400' },
};

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: '', label: 'ทั้งหมด' },
];

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
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/disputes${filterStatus ? `?status=${filterStatus}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) setDisputes(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">⚠️ Disputes</h1>
          <p className="text-sm text-gray-400 mt-1">{disputes.length} รายการ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filterStatus === f.key
                  ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-[#1E2130] rounded-2xl border border-white/5 p-16 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-white font-semibold">ไม่มี dispute ในตอนนี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => {
            const sc = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.open;
            return (
              <div key={d._id} className="bg-[#1E2130] rounded-2xl border border-white/5 hover:border-white/10 transition-all p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + reason */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      <span className="text-sm font-semibold text-white">{REASON_LABELS[d.reason] ?? d.reason}</span>
                      <span className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(d.createdAt), { locale: th, addSuffix: true })}
                      </span>
                    </div>

                    {/* Parties */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <span>ผู้รายงาน: <span className="text-white font-medium">{d.reporter?.displayName}</span></span>
                      <span className="text-gray-600">→</span>
                      <span>ผู้ถูกรายงาน: <span className="text-white font-medium">{d.reportedUser?.displayName}</span></span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 bg-white/5 rounded-xl p-4 leading-relaxed border border-white/5 mb-3">
                      {d.description}
                    </p>

                    {/* Evidence */}
                    {d.evidence?.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {d.evidence.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedEvidence(url)}
                            className="rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400/40 transition-all"
                          >
                            <img src={url} alt={`evidence ${i + 1}`} className="w-14 h-14 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resolution */}
                    {d.resolution && (
                      <div className="bg-green-400/5 border border-green-400/20 rounded-xl px-4 py-3 text-sm text-green-400">
                        <span className="font-semibold">การตัดสิน: </span>{d.resolution}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/bookings/${d.booking?._id}`)}
                      className="px-3 py-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all whitespace-nowrap"
                    >
                      ดูการจอง
                    </button>
                    {['open', 'reviewing'].includes(d.status) && (
                      <button
                        onClick={() => { setResolveModal(d); setResolution(''); setResolveAction('resolve'); }}
                        className="px-3 py-1.5 text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-xl font-semibold hover:bg-yellow-400/30 transition-all whitespace-nowrap"
                      >
                        ⚖️ ตัดสิน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => setSelectedEvidence(null)}>
          <div onClick={e => e.stopPropagation()} className="relative max-w-lg w-full">
            <button onClick={() => setSelectedEvidence(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> ปิด
            </button>
            <img src={selectedEvidence} alt="evidence" className="w-full rounded-2xl max-h-[80vh] object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-[#1E2130] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">⚖️ ตัดสิน Dispute</h3>
            <p className="text-sm text-gray-400">{REASON_LABELS[resolveModal.reason]} — {resolveModal.reporter?.displayName}</p>

            <div className="grid grid-cols-2 gap-2">
              {(['resolve', 'dismiss'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => setResolveAction(a)}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    resolveAction === a
                      ? a === 'resolve'
                        ? 'border-green-500/50 bg-green-500/10 text-green-400'
                        : 'border-gray-500/50 bg-gray-500/10 text-gray-400'
                      : 'border-white/10 text-gray-600 hover:border-white/20'
                  }`}
                >
                  {a === 'resolve' ? '✅ Resolved' : '🚫 Dismissed'}
                </button>
              ))}
            </div>

            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder="คำอธิบายการตัดสินใจ..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm resize-none focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
            />

            <div className="flex gap-3">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-all">
                ยกเลิก
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution || actionLoading}
                className="flex-1 py-2.5 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-xl font-semibold disabled:opacity-50 hover:bg-yellow-400/30 transition-all"
              >
                {actionLoading ? '...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
