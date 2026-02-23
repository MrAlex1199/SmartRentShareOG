'use client';

import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, differenceInDays, addDays, isWithinInterval, isBefore, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  bookedDates?: Array<{ startDate: Date; endDate: Date }>;
  onDateChange: (range: DateRange | undefined) => void;
  selectedRange?: DateRange;
  dailyPrice: number;
  deposit?: number;
  deliveryFee?: number;
}

export function DateRangePicker({ 
  bookedDates = [], 
  onDateChange, 
  selectedRange,
  dailyPrice,
  deposit = 0,
  deliveryFee = 0,
}: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(selectedRange);
  const today = startOfDay(new Date());

  // Create array of disabled dates from booked ranges
  const disabledDates = bookedDates.flatMap(({ startDate, endDate }) => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  });

  // Check if a date is booked
  const isBooked = (date: Date) => {
    return bookedDates.some(({ startDate, endDate }) =>
      isWithinInterval(date, { start: new Date(startDate), end: new Date(endDate) })
    );
  };

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onDateChange(newRange);
  };

  const calculateTotal = () => {
    if (!range?.from || !range?.to) return null;
    
    const days = differenceInDays(range.to, range.from) + 1;
    const rentalCost = days * dailyPrice;
    const total = rentalCost + deliveryFee + deposit;
    
    return { days, rentalCost, total };
  };

  const totals = calculateTotal();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">เลือกวันที่เช่า</h3>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>วันที่เลือก</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-200"></div>
            <span>ถูกจองแล้ว</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>ไม่สามารถเลือกได้</span>
          </div>
        </div>

        <style>{`
          .rdp-day_booked {
            background-color: #fee2e2 !important;
            color: #dc2626 !important;
            text-decoration: line-through;
            opacity: 0.7;
          }
          .rdp-day_booked:hover {
            background-color: #fecaca !important;
          }
          .rdp-day_selected {
            background-color: #FACC15 !important;
            color: #111827 !important;
            font-weight: 600;
          }
          .rdp-day_range_middle {
            background-color: #FEF9C3 !important;
            color: #111827 !important;
          }
          .rdp-day_today:not(.rdp-day_selected) {
            font-weight: bold;
            color: #d97706;
          }
          .rdp-day_disabled {
            color: #d1d5db !important;
            text-decoration: line-through;
          }
          .rdp {
            --rdp-cell-size: 40px;
            margin: 0;
          }
        `}</style>
        
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          disabled={[
            { before: today },
            ...disabledDates,
          ]}
          modifiers={{
            booked: disabledDates.filter(d => !isBefore(d, today)),
          }}
          modifiersClassNames={{
            booked: 'rdp-day_booked',
            selected: 'rdp-day_selected',
            today: 'rdp-day_today',
            disabled: 'rdp-day_disabled',
          }}
          locale={th}
          className="mx-auto"
          showOutsideDays={false}
          numberOfMonths={1}
        />

        {/* Booked dates count indicator */}
        {bookedDates.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>มีวันที่ถูกจองแล้ว {bookedDates.length} ช่วง — กรุณาเลือกวันที่ว่าง</span>
          </div>
        )}

        {/* Date summary */}
        {range?.from && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">วันเริ่มต้น:</span>
                <span className="font-medium text-gray-900">
                  {format(range.from, 'd MMMM yyyy', { locale: th })}
                </span>
              </div>
              
              {range.to && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันสิ้นสุด:</span>
                    <span className="font-medium text-gray-900">
                      {format(range.to, 'd MMMM yyyy', { locale: th })}
                    </span>
                  </div>
                  
                  {totals && (
                    <>
                      <div className="flex justify-between pt-2 border-t border-gray-100">
                        <span className="text-gray-600">จำนวนวัน:</span>
                        <span className="font-medium text-gray-900">{totals.days} วัน</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">ค่าเช่า ({totals.days} × ฿{dailyPrice.toLocaleString()}):</span>
                        <span className="font-medium text-gray-900">฿{totals.rentalCost.toLocaleString()}</span>
                      </div>

                      {deliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">ค่าจัดส่ง:</span>
                          <span className="font-medium text-gray-900">฿{deliveryFee.toLocaleString()}</span>
                        </div>
                      )}

                      {deposit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">มัดจำ (คืนเมื่อส่งของกลับ):</span>
                          <span className="font-medium text-gray-900">฿{deposit.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-900 font-semibold">รวมทั้งหมด:</span>
                        <span className="text-xl font-bold text-primary">
                          ฿{totals.total.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!range?.from && (
        <p className="text-sm text-gray-500 text-center">
          กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดการเช่า
        </p>
      )}
    </div>
  );
}
