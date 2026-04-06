'use client';

import { useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface PendingUser {
  _id: string;
  displayName: string;
  pictureUrl?: string;
  verification: {
    status: string;
    docType?: 'national_id' | 'student_id';
    imageUrl?: string;
    submittedAt?: string;
  };
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ userId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchPending = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/admin/verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/verify`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.message || 'เกิดข้อผิดพลาด');
        return;
      }
      setRejectModal(null);
      setRejectReason('');
      await fetchPending();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🪪 ยืนยันตัวตน</h1>
        <p className="text-sm text-gray-400 mt-1">
          {users.length > 0 ? `มี ${users.length} รายการรอตรวจสอบ` : 'ไม่มีรายการรอตรวจสอบ'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#1E2130] rounded-2xl border border-white/5 p-16 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-white font-semibold">ตรวจสอบครบแล้ว!</p>
          <p className="text-sm text-gray-500 mt-1">ไม่มีเอกสารรอตรวจสอบ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(u => (
            <div key={u._id} className="bg-[#1E2130] rounded-2xl border border-white/5 hover:border-white/10 transition-all p-6">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {u.pictureUrl ? (
                    <img src={u.pictureUrl} alt={u.displayName} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-yellow-400">{u.displayName.charAt(0)}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-white">{u.displayName}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {u.verification.docType === 'student_id' ? '🎓 บัตรนักศึกษา' : '🪪 บัตรประชาชน'}
                        {u.verification.submittedAt && ` · ส่งเมื่อ ${formatDistanceToNow(new Date(u.verification.submittedAt), { locale: th, addSuffix: true })}`}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-yellow-400/15 text-yellow-400 rounded-lg text-xs font-medium border border-yellow-400/20 whitespace-nowrap">
                      ⏳ รอตรวจสอบ
                    </span>
                  </div>

                  {/* ID Card Image */}
                  {u.verification.imageUrl && (
                    <button
                      onClick={() => setSelectedImage(u.verification.imageUrl!)}
                      className="mt-4 relative group overflow-hidden rounded-xl border border-white/10 hover:border-yellow-400/40 inline-block transition-all"
                    >
                      <img
                        src={u.verification.imageUrl}
                        alt="ID card"
                        className="h-28 object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/70 px-3 py-1.5 rounded-lg">
                          🔍 ขยายดู
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAction(u._id, 'approve')}
                      disabled={actionLoading === u._id}
                      className="px-5 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm font-semibold hover:bg-green-500/30 disabled:opacity-50 transition-all"
                    >
                      {actionLoading === u._id ? '...' : '✅ อนุมัติ'}
                    </button>
                    <button
                      onClick={() => { setRejectModal({ userId: u._id, name: u.displayName }); setRejectReason(''); }}
                      disabled={actionLoading === u._id}
                      className="px-5 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-all"
                    >
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ปิด
            </button>
            <img src={selectedImage} alt="ID full" className="w-full rounded-2xl object-contain max-h-[80vh] shadow-2xl" />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="bg-[#1E2130] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">ปฏิเสธการยืนยัน — {rejectModal.name}</h3>
            <div>
              <p className="text-sm text-gray-400 mb-2">เลือกเหตุผล:</p>
              <div className="space-y-2 mb-3">
                {[
                  'รูปไม่ชัดเจน ไม่สามารถอ่านข้อมูลได้',
                  'ไม่ใช่บัตรตามที่ระบุ',
                  'ข้อมูลไม่ตรงกับบัญชี',
                  'บัตรหมดอายุ',
                ].map(r => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-all ${
                      rejectReason === r
                        ? 'border-red-500/40 bg-red-500/10 text-red-400'
                        : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={2}
                placeholder="หรือใส่เหตุผลเอง..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-400/50 resize-none placeholder:text-gray-600"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-all">
                ยกเลิก
              </button>
              <button
                onClick={() => handleAction(rejectModal.userId, 'reject', rejectReason)}
                disabled={!rejectReason || actionLoading === rejectModal.userId}
                className="flex-1 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold disabled:opacity-50 hover:bg-red-500/30 transition-all"
              >
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
