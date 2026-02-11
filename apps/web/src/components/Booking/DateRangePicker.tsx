'use client';

import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, differenceInDays, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  bookedDates?: Array<{ startDate: Date; endDate: Date }>;
  onDateChange: (range: DateRange | undefined) => void;
  selectedRange?: DateRange;
  dailyPrice: number;
}

export function DateRangePicker({ 
  bookedDates = [], 
  onDateChange, 
  selectedRange,
  dailyPrice 
}: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(selectedRange);

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

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    onDateChange(newRange);
  };

  const calculateTotal = () => {
    if (!range?.from || !range?.to) return null;
    
    const days = differenceInDays(range.to, range.from) + 1;
    const total = days * dailyPrice;
    
    return { days, total };
  };

  const totals = calculateTotal();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เลือกวันที่เช่า</h3>
        
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          disabled={[
            { before: new Date() },
            ...disabledDates,
          ]}
          locale={th}
          className="mx-auto"
          modifiersClassNames={{
            selected: 'bg-primary text-gray-900',
            today: 'font-bold text-primary',
            disabled: 'text-gray-300 line-through',
          }}
        />

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
                        <span className="text-gray-600">ราคาต่อวัน:</span>
                        <span className="font-medium text-gray-900">฿{dailyPrice.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-900 font-semibold">ราคารวม:</span>
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
