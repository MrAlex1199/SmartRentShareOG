'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { CloudinaryLib } from '@/lib/cloudinary';
import { ItemCategory, ItemCondition } from '@repo/shared';
import Cookies from 'js-cookie';
import { Header } from '@/components/Layout/Header';
import { Button } from '@/components/ui/Button';

export default function CreateItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: ItemCategory.OTHER,
        condition: ItemCondition.GOOD,
        dailyPrice: '',
        deposit: '',
        university: 'CU',
        area: '',
        deliveryType: 'pickup'
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setImages(prev => [...prev, ...acceptedFiles]);
        const newUrls = acceptedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newUrls]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 5
    });

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload Images
            const imageUrls = await Promise.all(
                images.map(file => CloudinaryLib.uploadImage(file))
            );

            // 2. Create Item
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    condition: formData.condition,
                    dailyPrice: Number(formData.dailyPrice),
                    deposit: Number(formData.deposit),
                    images: imageUrls,
                    location: {
                        university: formData.university,
                        area: formData.area
                    },
                    deliveryOptions: [formData.deliveryType]
                })
            });

            if (!response.ok) throw new Error('Failed to create item');

            alert('ลงประกาศสำเร็จ!');
            router.push('/');
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการลงประกาศ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">ลงประกาศให้เช่า</h1>
                    <p className="text-gray-600 mt-1">กรอกข้อมูลสินค้าของคุณ</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Images Upload */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <label className="block text-lg font-semibold mb-4">รูปภาพสินค้า</label>
                        <div 
                            {...getRootProps()} 
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                                isDragActive 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-700 font-medium mb-1">
                                {isDragActive ? 'วางรูปที่นี่...' : 'ลากรูปมาวาง หรือคลิกเพื่อเลือก'}
                            </p>
                            <p className="text-sm text-gray-500">รองรับไฟล์ JPG, PNG (สูงสุด 5 รูป)</p>
                        </div>
                        
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                                {previewUrls.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img 
                                            src={url} 
                                            alt={`Preview ${i + 1}`} 
                                            className="w-full aspect-square object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า *</label>
                            <input 
                                required
                                type="text" 
                                placeholder="เช่น กล้อง Canon EOS M50"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด *</label>
                            <textarea 
                                required
                                rows={4}
                                placeholder="อธิบายสภาพสินค้า คุณสมบัติ และข้อควรระวัง"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                                <select 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value as ItemCategory})}
                                >
                                    {Object.values(ItemCategory).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">สภาพสินค้า</label>
                                <select 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.condition}
                                    onChange={e => setFormData({...formData, condition: e.target.value as ItemCondition})}
                                >
                                    {Object.values(ItemCondition).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold">ราคา</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ค่าเช่า/วัน (บาท) *</label>
                                <input 
                                    required
                                    type="number" 
                                    min="0"
                                    placeholder="50"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.dailyPrice}
                                    onChange={e => setFormData({...formData, dailyPrice: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">มัดจำ (บาท) *</label>
                                <input 
                                    required
                                    type="number" 
                                    min="0"
                                    placeholder="500"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={formData.deposit}
                                    onChange={e => setFormData({...formData, deposit: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                        <h2 className="text-lg font-semibold">สถานที่</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">จุดนัดรับ/ส่ง *</label>
                            <input 
                                required
                                type="text"
                                placeholder="เช่น คณะวิศวกรรมศาสตร์ จุฬาฯ"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={formData.area}
                                onChange={e => setFormData({...formData, area: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.back()}
                        >
                            ยกเลิก
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            loading={loading}
                            className="flex-1"
                        >
                            {loading ? 'กำลังลงประกาศ...' : 'ลงประกาศ'}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
