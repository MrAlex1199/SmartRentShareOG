'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Cookies from 'js-cookie';

interface PaymentUploadProps {
    bookingId: string;
    totalAmount: number;
    promptpayNumber?: string;
    onSuccess?: () => void;
}

interface PaymentState {
    status: 'pending' | 'submitted' | 'verified' | 'rejected';
    slipImageUrl?: string;
    submittedAt?: string;
    rejectionReason?: string;
}

// ใช้ Platform PromptPay เพื่อ Manual Escrow — เงินไม่เข้าเจ้าของสินค้าโดยตรง
const PLATFORM_PROMPTPAY = process.env.NEXT_PUBLIC_PLATFORM_PROMPTPAY ?? '0625783770';

export function PaymentUpload({ bookingId, totalAmount, onSuccess }: Omit<PaymentUploadProps, 'promptpayNumber'>) {
    const [paymentState, setPaymentState] = useState<PaymentState>({ status: 'pending' });
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const f = acceptedFiles[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setError('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        maxSize: 5 * 1024 * 1024,
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file) return setError('กรุณาเลือกรูปหลักฐานการโอน');
        try {
            setUploading(true);
            setError('');
            const token = Cookies.get('token');

            // 1. Upload slip image to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!uploadRes.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ');
            const uploadData = await uploadRes.json();

            // 2. Submit slip URL to backend
            const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/booking/${bookingId}/slip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    slipImageUrl: uploadData.secure_url || uploadData.url,
                    slipPublicId: uploadData.public_id || '',
                }),
            });
            if (!payRes.ok) {
                const d = await payRes.json().catch(() => ({}));
                throw new Error(d.message || 'ส่งหลักฐานไม่สำเร็จ');
            }

            setPaymentState({
                status: 'submitted',
                slipImageUrl: uploadData.secure_url || uploadData.url,
                submittedAt: new Date().toISOString(),
            });
            onSuccess?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (paymentState.status === 'verified') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-semibold text-green-800 text-lg">ชำระเงินสำเร็จ</h3>
                <p className="text-sm text-green-600 mt-1">เจ้าของยืนยันการชำระเงินของคุณแล้ว</p>
            </div>
        );
    }

    if (paymentState.status === 'submitted') {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">⏳</div>
                <h3 className="font-semibold text-blue-800 text-lg">รอการยืนยัน</h3>
                <p className="text-sm text-blue-600 mt-1">ส่งหลักฐานแล้ว กำลังรอเจ้าของตรวจสอบ</p>
                {paymentState.slipImageUrl && (
                    <img
                        src={paymentState.slipImageUrl}
                        alt="slip"
                        className="mt-4 mx-auto max-h-48 rounded-lg border object-contain"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">ชำระเงินผ่าน PromptPay</h3>
                <p className="text-sm text-gray-500 mt-0.5">โอนเงินเข้าบัญชีแพลตฟอร์ม แพลตฟอร์มจะ hold เงินไว้ และโอนให้เจ้าของหลังเสร็จสิ้น</p>
            </div>

            {/* Escrow Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                <p className="font-semibold">🔒 ระบบ Escrow — เงินปลอดภัย</p>
                <p className="mt-0.5 text-blue-700">เงินของคุณจะถูก hold ไว้กับแพลตฟอร์ม และจะ release ให้เจ้าของสินค้าหลังรับ-ส่งสำเร็จเท่านั้น</p>
            </div>

            {/* Amount */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-yellow-800 font-medium">ยอดที่ต้องชำระ</span>
                <span className="text-xl font-bold text-yellow-900">฿{totalAmount.toLocaleString()}</span>
            </div>

            {/* PromptPay info */}
            <div className="border border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">โอนเงินมาที่ PromptPay (แพลตฟอร์ม)</p>
                <p className="text-2xl font-bold text-gray-900 tracking-widest">{PLATFORM_PROMPTPAY}</p>
                <p className="text-xs text-gray-500 mt-0.5">Smart Rent & Share Platform</p>
                <p className="text-xs text-gray-400 mt-2">โอนเงินแล้วถ่ายสลิปมาแนบด้านล่าง</p>
            </div>

            {/* Dropzone */}
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">แนบสลิปโอนเงิน</p>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-primary bg-yellow-50'
                            : preview
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    {preview ? (
                        <div className="space-y-2">
                            <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-lg object-contain" />
                            <p className="text-xs text-gray-500">คลิกหรือลากเพื่อเปลี่ยนรูป</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">
                                {isDragActive ? 'ปล่อยรูปที่นี่' : 'ลากรูป หรือคลิกเพื่อเลือก'}
                            </p>
                            <p className="text-xs text-gray-400">JPG, PNG สูงสุด 5MB</p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full py-3 bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
                {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        กำลังส่ง...
                    </span>
                ) : '📤 ส่งหลักฐานการชำระเงิน'}
            </button>
        </div>
    );
}
