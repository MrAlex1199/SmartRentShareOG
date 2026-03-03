'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item } from '@repo/shared';
import Cookies from 'js-cookie';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyListings();
    }, []);

    const fetchMyListings = async () => {
        try {
            console.log('Dashboard: Starting fetchMyListings...');
            console.log('Dashboard: All cookies:', document.cookie);
            
            const token = Cookies.get('token');
            console.log('Dashboard: Token from Cookies.get():', token ? `Found (${token.substring(0, 20)}...)` : 'Not found');
            
            if (!token) {
                console.log('Dashboard: No token, redirecting to login');
                router.push('/auth/login');
                return;
            }

            console.log('Dashboard: Fetching my listings...');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/my-listings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Dashboard: API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard: Got items:', data.length);
                setItems(data);
            } else if (response.status === 401) {
                console.log('Dashboard: Unauthorized, clearing token and redirecting');
                Cookies.remove('token');
                router.push('/auth/login');
            } else {
                console.error('Dashboard: API error:', response.status);
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบประกาศนี้หรือไม่?')) return;

        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('ลบประกาศสำเร็จ');
                fetchMyListings();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('เกิดข้อผิดพลาด');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8">
                <div className="mb-4 sm:mb-6 flex items-start justify-between gap-2">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">ประกาศของฉัน</h1>
                        <p className="text-sm text-gray-500">จัดการประกาศให้เช่าของคุณ</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/payouts')}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                    >
                        💸 รายการรับเงิน
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm text-center">
                        <div className="text-2xl mb-1">📦</div>
                        <p className="text-xs text-gray-500">ประกาศทั้งหมด</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{items.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm text-center">
                        <div className="text-2xl mb-1">✅</div>
                        <p className="text-xs text-gray-500">พร้อมให้เช่า</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{items.filter(i => i.isAvailable).length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 sm:p-5 shadow-sm text-center">
                        <div className="text-2xl mb-1">👁️</div>
                        <p className="text-xs text-gray-500">ยอดดูรวม</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{items.reduce((sum, item) => sum + (item.views || 0), 0)}</p>
                    </div>
                </div>

                {/* Items List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีประกาศ</h3>
                        <p className="text-gray-600 mb-6">เริ่มต้นลงประกาศสินค้าของคุณเลย!</p>
                        <Button variant="primary" onClick={() => router.push('/items/create')}>
                            + ลงประกาศใหม่
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item._id} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex gap-3">
                                    {/* Image */}
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                        {item.images.length > 0 ? (
                                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        {/* Title + Status */}
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 leading-tight">{item.title}</h3>
                                            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {item.isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
                                            </span>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-1 mb-1.5 flex-wrap">
                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{item.category}</span>
                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{item.condition}</span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-gray-400 line-clamp-1 mb-2">{item.description}</p>

                                        {/* Price + Actions */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-bold text-primary">฿{item.dailyPrice}</span>
                                                <span className="text-xs text-gray-400">/วัน</span>
                                                <span className="text-xs text-gray-400 ml-1">👁 {item.views || 0}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => router.push(`/items/${item._id}`)}
                                                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    ดู →
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    ลบ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
