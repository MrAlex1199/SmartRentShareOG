'use client';

import { Header } from '@/components/Layout/Header';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-blue-50 px-8 py-12 border-b border-blue-100 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ความปลอดภัยและนโยบาย (Trust & Safety)
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              เราให้ความสำคัญกับความปลอดภัยของคุณเป็นอันดับแรก เรียนรู้มาตรการที่เราใช้ปกป้องคอมมูนิตี้ของเรา
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 prose prose-blue max-w-none text-gray-700">
            <h2>มาตรการความปลอดภัยของเรา</h2>
            
            <div className="grid sm:grid-cols-2 gap-6 my-8 not-prose">
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="font-bold text-gray-900 mb-2">ระบบ Escrow</h3>
                <p className="text-sm text-gray-600">เงินค่าเช่าจะถูกเก็บรักษาไว้ส่วนกลาง และจะโอนให้เจ้าของเมื่อการเช่าเสร็จสิ้นสมบูรณ์เท่านั้น ป้องกันการโกง 100%</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="text-3xl mb-3">🪪</div>
                <h3 className="font-bold text-gray-900 mb-2">ยืนยันตัวตนนักศึกษา</h3>
                <p className="text-sm text-gray-600">ผู้ใช้ทุกคนต้องยืนยันตัวตนด้วยบัตรนักศึกษาก่อนใช้งาน เพื่อสร้างคอมมูนิตี้ที่เชื่อถือได้</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="text-3xl mb-3">📸</div>
                <h3 className="font-bold text-gray-900 mb-2">บันทึกสภาพสินค้า</h3>
                <p className="text-sm text-gray-600">ระบบบังคับให้ถ่ายรูป Before/After ทุกครั้งที่มีการรับ-ส่งสินค้า เพื่อเป็นหลักฐานหากเกิดความเสียหาย</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="text-3xl mb-3">⭐</div>
                <h3 className="font-bold text-gray-900 mb-2">ระบบรีวิวโปร่งใส</h3>
                <p className="text-sm text-gray-600">รีวิวทั้งหมดมาจากผู้ใช้งานจริงที่ทำรายการสำเร็จเท่านั้น ไม่สามารถปลอมแปลงได้</p>
              </div>
            </div>

            <h2>กรณีเกิดความเสียหายหรือสูญหาย</h2>
            <p>
              [รอใส่เนื้อหา: ขั้นตอนการระงับข้อพิพาท, การหักเงินมัดจำ, และการช่วยเหลือจากส่วนกลาง]
            </p>

            <h2>คำแนะนำเพื่อความปลอดภัย</h2>
            <ul>
              <li><strong>อย่าโอนเงินนอกระบบ:</strong> เพื่อความปลอดภัยสูงสุด กรุณาทำธุรกรรมผ่านระบบของ SmartRent เสมอ</li>
              <li><strong>ตรวจเช็คสินค้าให้ละเอียด:</strong> ทั้งก่อนรับและก่อนคืน ควรถ่ายรูป/วิดีโอเก็บไว้เป็นหลักฐาน</li>
              <li><strong>นัดรับในที่สาธารณะ:</strong> ควรนัดรับสินค้าในพื้นที่มหาวิทยาลัยที่มีผู้คนสัญจรและมีแสงสว่างเพียงพอ</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
