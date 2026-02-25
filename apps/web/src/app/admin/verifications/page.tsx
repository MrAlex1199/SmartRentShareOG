'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
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
    rejectionReason?: string;
  };
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ userId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchPending = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/admin/verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) { router.push('/'); return; }
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/verify`, {
        method: 'PATCH',
        headers,
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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🪪 ตรวจสอบการยืนยันตัวตน</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length > 0 ? `มี ${users.length} รายการรอตรวจสอบ` : 'ไม่มีรายการรอตรวจสอบ'}
          </p>
        </div>

        {users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-500 font-medium">ตรวจสอบครบแล้ว!</p>
            <p className="text-sm text-gray-400 mt-1">ไม่มีเอกสารรอตรวจสอบ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map(u => (
              <div key={u._id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {u.pictureUrl ? (
                      <img src={u.pictureUrl} alt={u.displayName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{u.displayName.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{u.displayName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {u.verification.docType === 'student_id' ? '🎓 บัตรนักศึกษา' : '🪪 บัตรประชาชน'}
                          {u.verification.submittedAt && ` · ส่งเมื่อ ${formatDistanceToNow(new Date(u.verification.submittedAt), { locale: th, addSuffix: true })}`}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium whitespace-nowrap">⏳ รอตรวจสอบ</span>
                    </div>

                    {/* ID Card Image */}
                    {u.verification.imageUrl && (
                      <div className="mt-3">
                        <button
                          onClick={() => setSelectedImage(u.verification.imageUrl!)}
                          className="relative group overflow-hidden rounded-lg border border-gray-200 inline-block"
                        >
                          <img
                            src={u.verification.imageUrl}
                            alt="ID card"
                            className="h-32 object-contain group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/60 px-2 py-1 rounded">ขยาย</span>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAction(u._id, 'approve')}
                        disabled={actionLoading === u._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        ✅ อนุมัติ
                      </button>
                      <button
                        onClick={() => { setRejectModal({ userId: u._id, name: u.displayName }); setRejectReason(''); }}
                        disabled={actionLoading === u._id}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors"
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
      </div>

      {/* ── Image Preview Modal ── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:underline"
            >
              ✕ ปิด
            </button>
            <img src={selectedImage} alt="ID card full" className="w-full rounded-xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">ปฏิเสธ — {rejectModal.name}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล</label>
              <div className="space-y-2 mb-2">
                {[
                  'รูปไม่ชัดเจน ไม่สามารถอ่านข้อมูลได้',
                  'ไม่ใช่บัตรตามที่ระบุ',
                  'ข้อมูลไม่ตรงกับบัญชี',
                  'บัตรหมดอายุ',
                ].map(r => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${rejectReason === r ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                ยกเลิก
              </button>
              <button
                onClick={() => handleAction(rejectModal.userId, 'reject', rejectReason)}
                disabled={!rejectReason || actionLoading === rejectModal.userId}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-red-700"
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
