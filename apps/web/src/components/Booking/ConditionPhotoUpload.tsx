'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Cookies from 'js-cookie';

interface Props {
  bookingId: string;
  phase: 'before' | 'after';
  existingImages?: string[];
  onSuccess: () => void;
}

export function ConditionPhotoUpload({ bookingId, phase, existingImages = [], onSuccess }: Props) {
  const [previews, setPreviews] = useState<string[]>(existingImages);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingImages);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const phaseLabel = phase === 'before' ? 'ก่อนรับของ' : 'หลังคืนของ';
  const phaseIcon = phase === 'before' ? '📦' : '✅';

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError('');
    const token = Cookies.get('token');
    const newUrls: string[] = [];
    const newPreviews: string[] = [...previews];

    for (const file of acceptedFiles) {
      try {
        // Preview
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise<void>(resolve => { reader.onload = () => { newPreviews.push(reader.result as string); resolve(); }; });

        // Upload via existing Cloudinary endpoint
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('อัปโหลดไม่สำเร็จ');
        const data = await res.json();
        newUrls.push(data.url || data.secure_url);
      } catch (err: any) {
        setError(err.message);
      }
    }

    setPreviews([...newPreviews]);
    setUploadedUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
    maxFiles: 6,
  });

  const handleRemove = (idx: number) => {
    setPreviews(p => p.filter((_, i) => i !== idx));
    setUploadedUrls(u => u.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (uploadedUrls.length === 0) { setError('กรุณาอัปโหลดรูปอย่างน้อย 1 รูป'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = Cookies.get('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/condition-photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phase, imageUrls: uploadedUrls, notes }),
      });
      if (!res.ok) throw new Error('บันทึกไม่สำเร็จ');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isDone = existingImages.length > 0 && uploadedUrls.length > 0 && JSON.stringify(existingImages) === JSON.stringify(uploadedUrls);

  if (isDone) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="font-semibold text-green-800">{phaseIcon} บันทึกรูปสภาพสินค้า{phaseLabel}แล้ว</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {existingImages.map((url, i) => (
            <img key={i} src={url} alt={`condition-${i}`} className="w-16 h-16 object-cover rounded-lg border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">{phaseIcon} อัปโหลดรูปสภาพสินค้า{phaseLabel}</h3>
      <p className="text-sm text-gray-500">ถ่ายรูปสินค้าทุกมุม เพื่อเป็นหลักฐานสภาพ{phaseLabel} (สูงสุด 6 รูป)</p>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-2">📸</div>
        {isDragActive ? (
          <p className="text-primary font-medium">วางรูปที่นี่</p>
        ) : (
          <>
            <p className="font-medium text-gray-700">ลากรูปมาวาง หรือคลิกเพื่อเลือก</p>
            <p className="text-sm text-gray-400 mt-1">PNG, JPG, HEIC (สูงสุด 6 รูป)</p>
          </>
        )}
        {uploading && <p className="text-sm text-primary mt-2 animate-pulse">กำลังอัปโหลด...</p>}
      </div>

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img src={src} alt={`preview-${i}`} className="w-full h-24 object-cover rounded-lg border" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">บันทึกสภาพสินค้า (ไม่บังคับ)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="เช่น: มีรอยขีดข่วนเล็กน้อยที่มุมขวา"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || uploadedUrls.length === 0}
        className="w-full py-2.5 bg-primary text-gray-900 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'กำลังบันทึก...' : `บันทึกรูปสภาพสินค้า${phaseLabel}`}
      </button>
    </div>
  );
}
