'use client';

import { Header } from '@/components/Layout/Header';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gray-100 px-8 py-12 border-b border-gray-200 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              นโยบาย Cookies (Cookies Policy)
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              อัปเดตล่าสุด: [วันที่]
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-10 prose prose-primary max-w-none text-gray-700">
            <p>
              เว็บไซต์ SmartRent มีการใช้คุกกี้ (Cookies) เพื่อพัฒนาประสบการณ์การใช้งานของคุณให้ดียิ่งขึ้น 
              เมื่อคุณใช้งานเว็บไซต์เรา ถือว่าคุณยินยอมให้มีการใช้คุกกี้ตามนโยบายนี้
            </p>

            <h2>คุกกี้คืออะไร?</h2>
            <p>
              คุกกี้คือไฟล์ข้อความขนาดเล็กที่ถูกดาวน์โหลดไปยังอุปกรณ์ของคุณเมื่อคุณเข้าชมเว็บไซต์ 
              ซึ่งช่วยให้เว็บไซต์จดจำอุปกรณ์และการตั้งค่าของคุณในการเข้าชมครั้งต่อไป
            </p>

            <h2>เราใช้คุกกี้ประเภทใดบ้าง?</h2>
            <ul>
              <li>
                <strong>คุกกี้ที่จำเป็น (Strictly Necessary Cookies):</strong> 
                คุกกี้ที่จำเป็นต่อการทำงานของเว็บไซต์ เช่น การเข้าสู่ระบบ (Authentication Token) หรือระบบตะกร้าสินค้า หากไม่มีคุกกี้เหล่านี้ เว็บไซต์จะไม่สามารถทำงานได้
              </li>
              <li>
                <strong>คุกกี้เพื่อการวิเคราะห์ (Analytical/Performance Cookies):</strong> 
                ช่วยให้เรารับรู้และนับจำนวนผู้เข้าชมเว็บไซต์ และดูว่าผู้เข้าชมไปยังหน้าต่างๆ อย่างไร เพื่อนำไปปรับปรุงให้เว็บไซต์ทำงานได้ดีขึ้น
              </li>
              <li>
                <strong>คุกกี้เพื่อการทำงานของเว็บไซต์ (Functionality Cookies):</strong> 
                ใช้จดจำผู้ใช้งานเมื่อกลับมายังเว็บไซต์อีกครั้ง เช่น จดจำภาษา หรือการตั้งค่าอื่นๆ ที่คุณเคยเลือกไว้
              </li>
            </ul>

            <h2>การจัดการคุกกี้</h2>
            <p>
              คุณสามารถตั้งค่าเบราว์เซอร์ของคุณให้ปฏิเสธคุกกี้ทั้งหมดหรือบางส่วนได้ อย่างไรก็ตาม หากคุณตั้งค่าเบราว์เซอร์ให้ปฏิเสธคุกกี้ทั้งหมด (รวมถึงคุกกี้ที่จำเป็น) คุณอาจไม่สามารถเข้าถึงบางส่วนของเว็บไซต์เราได้
            </p>
            
            <p className="mt-8 text-sm text-gray-500 italic">
              หากมีคำถามเพิ่มเติมเกี่ยวกับนโยบายคุกกี้ โปรด<a href="/contact">ติดต่อเรา</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
