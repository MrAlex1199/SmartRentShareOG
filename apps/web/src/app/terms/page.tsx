'use client';

import { Header } from '@/components/Layout/Header';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gray-100 px-8 py-12 border-b border-gray-200 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              เงื่อนไขการใช้งาน (Terms of Service)
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              อัปเดตล่าสุด: [วันที่]
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 prose prose-primary max-w-none text-gray-700">
            <p>
              [รอใส่เนื้อหา: อารัมภบทเกี่ยวกับการยอมรับข้อตกลงเมื่อใช้งานแพลตฟอร์ม]
            </p>

            <h2>1. บทบาทของ SmartRent</h2>
            <p>
              SmartRent ทำหน้าที่เป็นเพียงแพลตฟอร์มตัวกลาง (Marketplace) ในการเชื่อมโยงระหว่างผู้ให้เช่าและผู้เช่า 
              เราไม่ใช่เจ้าของสินค้า และไม่รับผิดชอบโดยตรงต่อความเสียหายของสินค้า แต่เรามีระบบช่วยเหลือ (Escrow & Trust) เพื่อลดความเสี่ยง
            </p>

            <h2>2. กฎสำหรับผู้ให้เช่า</h2>
            <ul>
              <li>สินค้าต้องเป็นของถูกกฎหมาย ไม่ใช่ของละเมิดลิขสิทธิ์ และปลอดภัยต่อผู้ใช้งาน</li>
              <li>ต้องระบุรายละเอียด ตำหนิ และสภาพสินค้าตามความเป็นจริง</li>
              <li>ห้ามเรียกเก็บค่าใช้จ่ายใดๆ นอกเหนือจากที่ระบุบนแพลตฟอร์ม</li>
              <li>ยินยอมให้หักค่าธรรมเนียมแพลตฟอร์ม (GP 10%) จากค่าเช่า (ไม่หักจากมัดจำ)</li>
            </ul>

            <h2>3. กฎสำหรับผู้เช่า</h2>
            <ul>
              <li>ต้องดูแลรักษาสินค้าเสมือนเป็นของตนเอง และคืนตามเวลาที่กำหนด</li>
              <li>หากสินค้าเสียหาย ต้องรับผิดชอบค่าซ่อมแซมตามจริง (โดยหักจากมัดจำหรือจ่ายเพิ่ม)</li>
              <li>ห้ามนำสินค้าไปให้ผู้อื่นเช่าช่วงต่อ (Sub-leasing) เด็ดขาด</li>
            </ul>

            <h2>4. นโยบายการระงับข้อพิพาท</h2>
            <p>
              [รอใส่เนื้อหา: ขั้นตอนการจัดการเมื่อเกิดข้อขัดแย้ง เช่น ของหาย พัง หรือคืนช้า]
            </p>
            
            <p className="mt-8 text-sm text-gray-500 italic">
              หากมีคำถามเพิ่มเติมเกี่ยวกับเงื่อนไขนี้ โปรด<a href="/contact">ติดต่อเรา</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
