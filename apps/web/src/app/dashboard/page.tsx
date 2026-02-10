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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">ประกาศของฉัน</h1>
                    <p className="text-gray-600">จัดการประกาศให้เช่าของคุณ</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">ประกาศทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">พร้อมให้เช่า</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {items.filter(i => i.isAvailable).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">ยอดดูรวม</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {items.reduce((sum, item) => sum + (item.views || 0), 0)}
                                </p>
                            </div>
                        </div>
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
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item._id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex gap-6">
                                    {/* Image */}
                                    <div className="w-32 h-32 flex-shrink-0">
                                        {item.images.length > 0 ? (
                                            <img 
                                                src={item.images[0]} 
                                                alt={item.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <span className="px-2 py-1 bg-gray-100 rounded">{item.category}</span>
                                                    <span className="px-2 py-1 bg-gray-100 rounded">{item.condition}</span>
                                                    <span className={`px-2 py-1 rounded ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.isAvailable ? 'พร้อมให้เช่า' : 'ไม่พร้อม'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">฿{item.dailyPrice}</p>
                                                <p className="text-sm text-gray-500">/วัน</p>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {item.views || 0} ครั้ง
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => router.push(`/items/${item._id}`)}
                                                >
                                                    ดูรายละเอียด
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    ลบ
                                                </Button>
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
