'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';

interface ReviewFormProps {
    bookingId: string;
    revieweeId: string;
    revieweeType: 'owner' | 'renter';
    revieweeName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface StarRatingProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
}

function StarRating({ label, value, onChange }: StarRatingProps) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => onChange(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <svg
                            className={`w-7 h-7 transition-colors ${star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function ReviewForm({
    bookingId,
    revieweeId,
    revieweeType,
    revieweeName,
    onSuccess,
    onCancel,
}: ReviewFormProps) {
    const [overallRating, setOverallRating] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [punctuality, setPunctuality] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!overallRating || !communication || !punctuality) {
            setError('กรุณาให้คะแนนทุกหัวข้อ');
            return;
        }

        try {
            setLoading(true);
            const token = Cookies.get('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking: bookingId,
                    reviewee: revieweeId,
                    revieweeType,
                    overallRating,
                    communication,
                    punctuality,
                    comment: comment.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'ไม่สามารถส่งรีวิวได้');
            }

            onSuccess?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const averageScore = overallRating && communication && punctuality
        ? ((overallRating + communication + punctuality) / 3).toFixed(1)
        : null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                รีวิว{revieweeType === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">ให้คะแนน <strong>{revieweeName}</strong> สำหรับการเช่าครั้งนี้</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Rating criteria */}
                <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                    <StarRating
                        label="⭐ ความพึงพอใจโดยรวม"
                        value={overallRating}
                        onChange={setOverallRating}
                    />
                    <div className="border-t border-gray-200" />
                    <StarRating
                        label="💬 การสื่อสาร"
                        value={communication}
                        onChange={setCommunication}
                    />
                    <div className="border-t border-gray-200" />
                    <StarRating
                        label="🕐 ความตรงต่อเวลา"
                        value={punctuality}
                        onChange={setPunctuality}
                    />
                </div>

                {/* Average score preview */}
                {averageScore && (
                    <div className="flex items-center gap-2 text-center justify-center">
                        <span className="text-3xl font-bold text-yellow-500">{averageScore}</span>
                        <span className="text-sm text-gray-500">/ 5.0 คะแนนเฉลี่ย</span>
                    </div>
                )}

                {/* Comment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ความคิดเห็น (ไม่บังคับ)
                    </label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="เขียนความคิดเห็นเพิ่มเติม..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            ยกเลิก
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-primary text-gray-900 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {loading ? 'กำลังส่ง...' : 'ส่งรีวิว ⭐'}
                    </button>
                </div>
            </form>
        </div>
    );
}
