'use client';

import { Header } from '@/components/Layout/Header';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gray-100 px-8 py-12 border-b border-gray-200 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              นโยบายความเป็นส่วนตัว (Privacy Policy)
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              อัปเดตล่าสุด: [วันที่]
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 prose prose-primary max-w-none text-gray-700">
            <p>
              [รอใส่เนื้อหา: อารัมภบทเกี่ยวกับความสำคัญของข้อมูลส่วนบุคคล]
            </p>

            <h2>1. ข้อมูลที่เรารวบรวม</h2>
            <ul>
              <li><strong>ข้อมูลส่วนบุคคลพื้นฐาน:</strong> ชื่อ-นามสกุล, รูปโปรไฟล์, LINE ID, อีเมล</li>
              <li><strong>ข้อมูลยืนยันตัวตน:</strong> ภาพถ่ายบัตรนักศึกษา, มหาวิทยาลัย, รหัสนักศึกษา</li>
              <li><strong>ข้อมูลการใช้งาน:</strong> ประวัติการค้นหา, การดูสินค้า, การจอง, และการชำระเงิน</li>
              <li><strong>ข้อมูลตำแหน่งที่ตั้ง:</strong> เพื่อแสดงสินค้าที่อยู่ใกล้คุณ (เฉพาะเมื่อคุณอนุญาต)</li>
            </ul>

            <h2>2. การใช้ข้อมูลของคุณ</h2>
            <p>เราใช้ข้อมูลของคุณเพื่อ:</p>
            <ul>
              <li>ให้บริการแพลตฟอร์มการเช่า-ยืม (เช่น การจับคู่ผู้เช่าและเจ้าของ)</li>
              <li>ยืนยันตัวตนเพื่อสร้างความปลอดภัยในคอมมูนิตี้</li>
              <li>ประมวลผลการชำระเงินและการคืนมัดจำ</li>
              <li>ติดต่อและส่งการแจ้งเตือนที่สำคัญ</li>
            </ul>

            <h2>3. การเปิดเผยข้อมูลให้บุคคลที่สาม</h2>
            <p>
              [รอใส่เนื้อหา: นโยบายการแชร์ข้อมูล เช่น แชร์ข้อมูลเบื้องต้นให้คู่สัญญาเมื่อเกิดการจอง หรือการแชร์ให้ผู้ให้บริการ Payment Gateway]
            </p>

            <h2>4. สิทธิในข้อมูลของคุณ</h2>
            <p>
              [รอใส่เนื้อหา: สิทธิในการขอดู แก้ไข หรือลบข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)]
            </p>
            
            <p className="mt-8 text-sm text-gray-500 italic">
              หากมีคำถามเพิ่มเติมเกี่ยวกับนโยบายนี้ โปรด<a href="/contact">ติดต่อเรา</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
