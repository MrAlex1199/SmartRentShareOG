'use client';

import { BookingStatus } from '@repo/shared';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return {
          label: 'รอยืนยัน',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
        };
      case BookingStatus.CONFIRMED:
        return {
          label: 'ยืนยันแล้ว',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
        };
      case BookingStatus.PAID:
        return {
          label: 'ชำระแล้ว',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
        };
      case BookingStatus.ACTIVE:
        return {
          label: 'กำลังเช่า',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200',
        };
      case BookingStatus.COMPLETED:
        return {
          label: 'เสร็จสิ้น',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        };
      case BookingStatus.CANCELLED:
        return {
          label: 'ยกเลิก',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
        };
      case BookingStatus.REJECTED:
        return {
          label: 'ปฏิเสธ',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
        };
      case BookingStatus.OVERDUE:
        return {
          label: 'เกินกำหนด',
          bgColor: 'bg-red-900',
          textColor: 'text-white',
          borderColor: 'border-red-900',
        };
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
