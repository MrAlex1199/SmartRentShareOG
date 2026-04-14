'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';

interface SavedAddress {
  label: string;
  address: string;
  isDefault: boolean;
}

interface SavedAddressesSectionProps {
  addresses: SavedAddress[];
  onRefresh: () => void;
}

export function SavedAddressesSection({ addresses, onRefresh }: SavedAddressesSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Show Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Form State
  const [label, setLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const token = Cookies.get('token');

  const resetForm = () => {
    setLabel('');
    setAddressText('');
    setIsDefault(false);
    setEditingIndex(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (idx: number) => {
    const addr = addresses[idx];
    setLabel(addr.label);
    setAddressText(addr.address);
    setIsDefault(addr.isDefault);
    setEditingIndex(idx);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !addressText.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const isEdit = editingIndex !== null;
      const url = isEdit 
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses/${editingIndex}`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ label, address: addressText, isDefault }),
      });

      if (!res.ok) throw new Error('บันทึกที่อยู่ไม่สำเร็จ');
      
      setSuccess('บันทึกที่อยู่สำเร็จ');
      resetForm();
      onRefresh();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm('ยืนยันการลบที่อยู่นี้?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses/${idx}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('ลบที่อยู่ไม่สำเร็จ');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (idx: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses/${idx}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ label: addresses[idx].label, address: addresses[idx].address, isDefault: true }),
      });
      if (!res.ok) throw new Error('ตั้งค่าที่อยู่หลักไม่สำเร็จ');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900">🏠 สมุดที่อยู่</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary hover:text-primary-dark font-medium px-3 py-1.5 bg-primary/10 rounded-lg transition-colors"
          >
            + เพิ่มที่อยู่ใหม่
          </button>
        )}
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {showForm ? (
        <form onSubmit={handleSubmit} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-4 mb-4">
          <h3 className="font-semibold text-sm text-gray-900">{editingIndex !== null ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อที่อยู่</label>
            <input 
              type="text" 
              placeholder="เช่น บ้าน, หอพัก, คณะวิศวะ" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดที่อยู่</label>
            <textarea 
              rows={2}
              placeholder="เช่น 123 หมู่ 4 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              value={addressText}
              onChange={e => setAddressText(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isDefault}
              onChange={e => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">ตั้งเป็นที่อยู่หลัก</span>
          </label>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={resetForm}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-gray-900 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
            </button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
          <p className="text-gray-500 text-sm">ยังไม่มีที่อยู่ที่บันทึกไว้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${addr.isDefault ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 bg-primary text-primary-dark text-xs font-bold rounded-full">
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{addr.address}</p>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(idx)}
                      disabled={loading}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="แก้ไข"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(idx)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="ลบ"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  {!addr.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(idx)}
                      disabled={loading}
                      className="text-xs text-primary hover:text-primary-dark hover:underline"
                    >
                      ตั้งเป็นค่าเริ่มต้น
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
