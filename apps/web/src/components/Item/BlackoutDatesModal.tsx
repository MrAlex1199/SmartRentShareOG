'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '../Booking/DateRangePicker';
import Cookies from 'js-cookie';

interface BlackoutDatesModalProps {
  itemId: string;
  isOpen: boolean;
  onClose: () => void;
  currentBlackoutDates: { startDate: string; endDate: string; reason?: string }[];
  onSuccess: () => void;
  bookedDates: Array<{ startDate: Date; endDate: Date }>;
}

export function BlackoutDatesModal({ itemId, isOpen, onClose, currentBlackoutDates, onSuccess, bookedDates }: BlackoutDatesModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddBlackout = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('กรุณาเลือกช่วงวันที่');
      return;
    }

    setLoading(true);
    setError('');

    // Prepare updated blackout dates array
    const updatedDates = [
      ...currentBlackoutDates,
      {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        reason,
      }
    ];

    try {
      const token = Cookies.get('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${itemId}/blackout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ blackoutDates: updatedDates }),
      });

      if (!res.ok) {
        throw new Error('บันทึกข้อมูลไม่สำเร็จ');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlackout = async (indexToRemove: number) => {
    if (!confirm('ยืนยันการลบวันหยุดนี้?')) return;
    
    setLoading(true);
    setError('');

    const updatedDates = currentBlackoutDates.filter((_, i) => i !== indexToRemove);

    try {
      const token = Cookies.get('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/${itemId}/blackout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ blackoutDates: updatedDates }),
      });

      if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ');
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">จัดการวันหยุดให้เช่า (Blackout Dates)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-6">
          {/* Current Blackout Dates */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">วันหยุดปัจจุบัน</h3>
            {currentBlackoutDates.length > 0 ? (
              <div className="space-y-2">
                {currentBlackoutDates.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-red-100 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        {new Date(b.startDate).toLocaleDateString('th-TH')} - {new Date(b.endDate).toLocaleDateString('th-TH')}
                      </p>
                      {b.reason && <p className="text-xs text-red-600 mt-0.5">{b.reason}</p>}
                    </div>
                    <button 
                      onClick={() => handleRemoveBlackout(idx)}
                      disabled={loading}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 border border-red-200 rounded-lg bg-white"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีการตั้งวันหยุด</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">เพิ่มวันหยุดใหม่</h3>
            <p className="text-sm text-gray-500 mb-4">
              กำหนดช่วงวันที่ไม่สะดวกให้เช่า ผู้เช่าจะไม่สามารถจองในช่วงเวลานี้ได้ (รวมถึงการจองที่มีอยู่จะแสดงในปฏิทินด้วย)
            </p>
            
            <DateRangePicker
              bookedDates={bookedDates}
              selectedRange={dateRange}
              onDateChange={setDateRange}
              dailyPrice={0}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (แสดงให้ผู้เช่าเห็น)</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="เช่น ร้านหยุดทำการ, ส่งซ่อม"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <button
              onClick={handleAddBlackout}
              disabled={loading || !dateRange?.from || !dateRange?.to}
              className="mt-4 w-full py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : '+ เพิ่มวันหยุด'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
