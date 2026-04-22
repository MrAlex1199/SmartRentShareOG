'use client';

import { Header } from '@/components/Layout/Header';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-primary/10 px-8 py-12 border-b border-gray-100 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ศูนย์ช่วยเหลือ (Help Center)
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              คู่มือและวิธีการใช้งาน Smart Rent & Share สำหรับทั้งผู้เช่าและผู้ให้เช่า
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 prose prose-primary max-w-none text-gray-700">
            <h2>เริ่มต้นใช้งาน</h2>
            <p>
              [รอใส่เนื้อหา: อธิบายวิธีการสมัครสมาชิก การตั้งค่าโปรไฟล์ และการยืนยันตัวตนนักศึกษา]
            </p>

            <h3>สำหรับผู้ให้เช่า</h3>
            <ul>
              <li><strong>การลงประกาศ:</strong> [อธิบายวิธีลงประกาศ กฎเหล็ก และเทคนิคการตั้งราคา]</li>
              <li><strong>การจัดการคำขอจอง:</strong> [อธิบายการยืนยัน/ปฏิเสธคำขอ และระบบปฏิทิน]</li>
              <li><strong>การรับเงิน:</strong> [อธิบายระบบ Escrow และการหัก GP 10%]</li>
            </ul>

            <h3>สำหรับผู้เช่า</h3>
            <ul>
              <li><strong>การค้นหาและจอง:</strong> [อธิบายการค้นหาของที่ต้องการ และขั้นตอนการส่งคำขอ]</li>
              <li><strong>การชำระเงินและรับของ:</strong> [อธิบายการโอนเงินแนบสลิป และการยืนยันสภาพสินค้าตอนรับของ]</li>
              <li><strong>การคืนของ:</strong> [อธิบายวิธียืนยันการส่งคืน และการได้รับมัดจำคืน]</li>
            </ul>

            <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบสิ่งที่ค้นหา?</h3>
              <p className="text-gray-600 mb-4">ทีมงานของเราพร้อมช่วยเหลือคุณเสมอ</p>
              <a href="/contact" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
                ติดต่อเรา
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
