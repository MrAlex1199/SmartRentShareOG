'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';

interface OwnerProfile {
  _id: string;
  displayName: string;
  pictureUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
}

interface Review {
  _id: string;
  overallRating: number;
  comment?: string;
  createdAt: string;
  reviewer: { displayName: string; pictureUrl?: string };
}

interface Item {
  _id: string;
  title: string;
  images: string[];
  dailyPrice: number;
  isAvailable: boolean;
  category: string;
}

export default function OwnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const BASE = process.env.NEXT_PUBLIC_API_URL;

    Promise.all([
      fetch(`${BASE}/users/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`${BASE}/items?owner=${id}`).then(r => r.ok ? r.json() : []),
      fetch(`${BASE}/reviews/user/${id}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([u, i, rv]) => {
        setOwner(u);
        setItems(Array.isArray(i) ? i : i?.items || []);
        setReviews(Array.isArray(rv) ? rv : []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    </div>
  );

  if (!owner) return (
    <div className="min-h-screen bg-gray-50"><Header />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-primary rounded-lg text-sm font-medium">ย้อนกลับ</button>
      </div>
    </div>
  );

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
    : owner.averageRating?.toFixed(1) ?? null;

  const memberSince = new Date(owner.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 space-y-6">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          ย้อนกลับ
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
          <div className="w-20 h-20 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
            {owner.pictureUrl
              ? <img src={owner.pictureUrl} alt={owner.displayName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{owner.displayName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">สมัครเมื่อ {memberSince}</p>
            <div className="flex gap-4 mt-2">
              {avgRating && (
                <span className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                  ⭐ {avgRating} <span className="text-gray-400 font-normal">({reviews.length || owner.totalReviews || 0} รีวิว)</span>
                </span>
              )}
              <span className="text-sm text-gray-500">📦 {items.length} รายการ</span>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {items.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">สินค้าที่ให้เช่า</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map(item => (
                <div
                  key={item._id}
                  onClick={() => router.push(`/items/${item._id}`)}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="h-32 bg-gray-100 relative">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-medium bg-black/60 px-2 py-0.5 rounded-full">ไม่ว่าง</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">฿{item.dailyPrice}<span className="text-gray-400 font-normal text-xs">/วัน</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">รีวิวที่ได้รับ</h2>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review._id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
                      {review.reviewer?.pictureUrl
                        ? <img src={review.reviewer.pictureUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{review.reviewer?.displayName || 'ผู้เช่า'}</p>
                        <span className="text-xs text-yellow-500">
                          {'★'.repeat(review.overallRating)}{'☆'.repeat(5 - review.overallRating)}
                        </span>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(review.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && reviews.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>ยังไม่มีข้อมูล</p>
          </div>
        )}
      </main>
    </div>
  );
}
