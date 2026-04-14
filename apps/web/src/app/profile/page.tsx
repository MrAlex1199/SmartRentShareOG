'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { format, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { SavedAddressesSection } from './SavedAddressesSection';

/* ─── Types ─── */
type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

interface User {
  _id: string;
  displayName: string;
  pictureUrl?: string;
  role: string;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  verification?: {
    status: VerificationStatus;
    docType?: 'national_id' | 'student_id';
    imageUrl?: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  savedAddresses?: {
    label: string;
    address: string;
    isDefault: boolean;
  }[];
}

interface Review {
  _id: string;
  reviewer: { _id: string; displayName: string; pictureUrl?: string };
  overallRating: number;
  communication: number;
  punctuality: number;
  comment?: string;
  createdAt: string;
}

/* ─── Helpers ─── */
function StarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <svg key={s} className={`w-4 h-4 ${s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        <span className="ml-1 text-gray-700 font-medium">{value.toFixed(1)}</span>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        {review.reviewer.pictureUrl ? (
          <img src={review.reviewer.pictureUrl} alt={review.reviewer.displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-gray-900">{review.reviewer.displayName.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-gray-900 text-sm">{review.reviewer.displayName}</span>
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(review.createdAt), { locale: th, addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <svg key={s} className={`w-4 h-4 ${s <= review.overallRating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500">({review.overallRating}.0)</span>
          </div>
          {review.comment && <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Verification Section ─── */
function VerificationSection({ user, token, onRefresh }: { user: User; token: string; onRefresh: () => void }) {
  const [docType, setDocType] = useState<'national_id' | 'student_id'>('student_id');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const status = user.verification?.status ?? 'none';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('ไฟล์ใหญ่เกิน 10MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) { setError('กรุณาเลือกรูปบัตร'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'ส่งคำขอไม่สำเร็จ');
      }
      setSuccess('ส่งเอกสารเรียบร้อยแล้ว! กำลังรอการตรวจสอบ');
      setPreview(null);
      setFile(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  /* Status UI */
  if (status === 'verified') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">🪪 การยืนยันตัวตน</h2>
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <span className="text-3xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">ยืนยันตัวตนสำเร็จแล้ว</p>
            <p className="text-sm text-green-600 mt-0.5">บัญชีของคุณได้รับ Badge ✓ ยืนยันแล้ว</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">🪪 การยืนยันตัวตน</h2>
        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="text-3xl">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800">รอการตรวจสอบ</p>
            <p className="text-sm text-yellow-700 mt-0.5">เจ้าหน้าที่กำลังตรวจสอบเอกสารของคุณ</p>
            {user.verification?.submittedAt && (
              <p className="text-xs text-yellow-600 mt-1">
                ส่งเมื่อ {formatDistanceToNow(new Date(user.verification.submittedAt), { locale: th, addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">🪪 ยืนยันตัวตน</h2>
        <p className="text-sm text-gray-500 mt-0.5">อัปโหลดบัตรประชาชน หรือ บัตรนักศึกษา เพื่อรับ Badge ✓ ยืนยันแล้ว</p>
      </div>

      {/* ปฏิเสธ + เหตุผล */}
      {status === 'rejected' && (
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <span className="text-xl">❌</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">ถูกปฏิเสธ — ส่งใหม่ได้เลย</p>
            {user.verification?.rejectionReason && (
              <p className="text-xs text-red-600 mt-0.5">เหตุผล: {user.verification.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Why verify */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-lg mb-1">🛡️</p>
          <p>ปลอดภัยกว่า</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-lg mb-1">⭐</p>
          <p>เพิ่มความน่าเชื่อถือ</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-lg mb-1">🔓</p>
          <p>ปลดล็อกฟีเจอร์</p>
        </div>
      </div>

      {/* Select doc type */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">ประเภทบัตร</p>
        <div className="grid grid-cols-2 gap-2">
          {(['student_id', 'national_id'] as const).map(t => (
            <button
              key={t}
              onClick={() => setDocType(t)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${docType === t ? 'border-primary bg-primary/10 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {t === 'student_id' ? '🎓 บัตรนักศึกษา' : '🪪 บัตรประชาชน'}
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">รูปถ่ายบัตร</p>
        <div
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${preview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {preview ? (
            <div className="space-y-2">
              <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-lg object-contain" />
              <p className="text-xs text-gray-500">คลิกเพื่อเปลี่ยนรูป</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">คลิกเพื่อเลือกรูป</p>
              <p className="text-xs text-gray-400">JPG, PNG สูงสุด 10MB · ต้องเห็นชื่อ-รหัสนักศึกษาชัดเจน</p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

      <button
        onClick={handleSubmit}
        disabled={uploading || !file}
        className="w-full py-3 bg-primary text-gray-900 rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {uploading ? '⏳ กำลังส่ง...' : '📤 ส่งเอกสารยืนยันตัวตน'}
      </button>

      <p className="text-xs text-gray-400 text-center">ข้อมูลบัตรของคุณจะไม่ถูกเผยแพร่ต่อสาธารณะ</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const token = Cookies.get('token');

  const fetchProfile = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers });
      if (!meRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
      const userData = await meRes.json();
      setUser(userData);

      const rvRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/user/${userData._id}`, { headers });
      if (rvRes.ok) setReviews(await rvRes.json());
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </div>
  );

  if (!user) return null;

  const memberSince = format(new Date(user.createdAt), 'MMMM yyyy', { locale: th });
  const verStatus = user.verification?.status ?? 'none';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Profile Header ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0">
              {user.pictureUrl ? (
                <img src={user.pictureUrl} alt={user.displayName} className="w-20 h-20 rounded-full object-cover border-4 border-primary/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-4 border-primary/30">
                  <span className="text-2xl font-bold text-gray-900">{user.displayName.charAt(0)}</span>
                </div>
              )}
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow" title="ยืนยันตัวตนแล้ว">
                  ✓
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
                {user.isVerified && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">✓ ยืนยันแล้ว</span>
                )}
                {verStatus === 'pending' && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">⏳ รอตรวจสอบ</span>
                )}
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {user.role === 'admin' ? '👑 Admin' : '🎓 นักศึกษา'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">สมาชิกตั้งแต่ {memberSince}</p>

              {user.totalReviews > 0 ? (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} className={`w-5 h-5 ${s <= Math.round(user.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{user.averageRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({user.totalReviews} รีวิว)</span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-3">ยังไม่มีคะแนน</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Verification Section ── */}
        <VerificationSection user={user} token={token!} onRefresh={fetchProfile} />

        {/* ── Saved Addresses Section ── */}
        <SavedAddressesSection 
          addresses={user.savedAddresses || []} 
          onRefresh={fetchProfile} 
        />

        {/* ── Rating Breakdown ── */}
        {user.totalReviews > 0 && reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">สรุปคะแนน</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center py-4">
                <span className="text-5xl font-bold text-gray-900">{user.averageRating.toFixed(1)}</span>
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} className={`w-5 h-5 ${s <= Math.round(user.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">จาก {user.totalReviews} รีวิว</p>
              </div>
              <div className="space-y-3">
                {(() => {
                  const avg = (key: keyof Review) => {
                    const vals = reviews.map(r => r[key] as number).filter(Boolean);
                    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                  };
                  return (
                    <>
                      <StarRow label="⭐ โดยรวม" value={avg('overallRating')} />
                      <StarRow label="💬 การสื่อสาร" value={avg('communication')} />
                      <StarRow label="🕐 ตรงต่อเวลา" value={avg('punctuality')} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── Reviews List ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">รีวิว ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-gray-500">ยังไม่มีรีวิว</p>
              <p className="text-sm text-gray-400 mt-1">เมื่อมีการเช่าเสร็จสมบูรณ์ รีวิวจะปรากฏที่นี่</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => <ReviewCard key={r._id} review={r} />)}
            </div>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/bookings')}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-primary hover:shadow-sm transition-all group"
          >
            <span className="text-2xl mb-2 block">📦</span>
            <p className="font-semibold text-gray-900 group-hover:text-primary">การจองของฉัน</p>
            <p className="text-xs text-gray-500 mt-0.5">ดูประวัติการเช่าทั้งหมด</p>
          </button>
          <button
            onClick={() => router.push('/bookings/requests')}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-primary hover:shadow-sm transition-all group"
          >
            <span className="text-2xl mb-2 block">📋</span>
            <p className="font-semibold text-gray-900 group-hover:text-primary">คำขอเช่าสินค้า</p>
            <p className="text-xs text-gray-500 mt-0.5">ดูคำขอที่รอการยืนยัน</p>
          </button>
        </div>
      </div>
    </div>
  );
}
