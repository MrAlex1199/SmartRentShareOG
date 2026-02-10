'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Item } from '@repo/shared';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';

export default function ItemDetailPage() {
    const params = useParams();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setItem(data);
                }
            } catch (error) {
                console.error('Error fetching item:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-gray-500">ไม่พบสินค้า</p>
                </div>
            </div>
        );
    }

    const ownerName = typeof item.owner === 'object' ? item.owner.displayName : 'Unknown';
    const ownerPicture = typeof item.owner === 'object' ? item.owner.pictureUrl : undefined;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Image Gallery */}
                    <div className="space-y-4">
                        {item.images.length > 0 ? (
                            <>
                                <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-sm">
                                    <img 
                                        src={item.images[currentImageIndex]} 
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {item.images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {item.images.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`aspect-square rounded-lg overflow-hidden ${
                                                    i === currentImageIndex ? 'ring-2 ring-primary' : ''
                                                }`}
                                            >
                                                <img 
                                                    src={img}
                                                    alt={`${item.title} ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                                <p className="text-gray-400">ไม่มีรูปภาพ</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-6">
                        {/* Title & Category */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-gray-100 text-sm font-medium text-gray-700 rounded-full">
                                    {item.category}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-sm text-gray-600 rounded-full">
                                    {item.condition}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                        </div>

                        {/* Price */}
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-bold text-gray-900">฿{item.dailyPrice}</span>
                                <span className="text-lg text-gray-600">/วัน</span>
                            </div>
                            <p className="text-sm text-gray-600">มัดจำ: ฿{item.deposit}</p>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-3">รายละเอียด</h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                        </div>

                        {/* Location */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-3">สถานที่</h2>
                            <div className="flex items-start gap-2 text-gray-700">
                                <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <p className="font-medium">{item.location.university}</p>
                                    <p className="text-sm text-gray-600">{item.location.area}</p>
                                    {item.location.building && (
                                        <p className="text-sm text-gray-500">{item.location.building}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Owner */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="font-semibold text-lg mb-3">เจ้าของ</h2>
                            <div className="flex items-center gap-3">
                                {ownerPicture ? (
                                    <img 
                                        src={ownerPicture} 
                                        alt={ownerName}
                                        className="w-12 h-12 rounded-full"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                                        <span className="text-lg font-bold text-gray-900">
                                            {ownerName.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">{ownerName}</p>
                                    <p className="text-sm text-gray-500">เจ้าของสินค้า</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <Button 
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => alert('ระบบจองจะเปิดใน Phase 3!')}
                        >
                            ขอเช่าสินค้านี้
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
