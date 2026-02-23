'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { format, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface User {
  _id: string;
  displayName: string;
  pictureUrl?: string;
  role: string;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
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
          {/* Stars */}
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { router.push('/'); return; }
    fetchProfile(token);
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers });
      if (!meRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
      const userData = await meRes.json();
      setUser(userData);

      // Fetch reviews for this user
      const rvRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/user/${userData._id}`, { headers });
      if (rvRes.ok) setReviews(await rvRes.json());
    } catch (err) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </div>
  );

  if (!user) return null;

  const memberSince = format(new Date(user.createdAt), 'MMMM yyyy', { locale: th });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Profile Header ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.pictureUrl ? (
                <img src={user.pictureUrl} alt={user.displayName} className="w-20 h-20 rounded-full object-cover border-4 border-primary/30" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-4 border-primary/30">
                  <span className="text-2xl font-bold text-gray-900">{user.displayName.charAt(0)}</span>
                </div>
              )}
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" title="ยืนยันตัวตนแล้ว">
                  ✓
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{user.displayName}</h1>
                {user.isVerified && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">✓ ยืนยันแล้ว</span>
                )}
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {user.role === 'admin' ? '👑 Admin' : '🎓 นักศึกษา'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">สมาชิกตั้งแต่ {memberSince}</p>

              {/* Rating summary */}
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

        {/* ── Rating Breakdown ── */}
        {user.totalReviews > 0 && reviews.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">สรุปคะแนน</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Score circle */}
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
              {/* Breakdown */}
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
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            รีวิว ({reviews.length})
          </h2>
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
