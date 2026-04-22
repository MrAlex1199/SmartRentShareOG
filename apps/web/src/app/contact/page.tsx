'use client';

import { Header } from '@/components/Layout/Header';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-green-50 px-8 py-12 border-b border-green-100 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ติดต่อเรา (Contact Us)
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              มีข้อสงสัย แจ้งปัญหาการใช้งาน หรือต้องการความช่วยเหลือ? ทีมงานของเราพร้อมดูแลคุณ
            </p>
          </div>

          {/* Content Section */}
          <div className="px-8 py-12">
            <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
              
              {/* LINE OA */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-[#00B900]/10 text-[#00B900] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">ติดต่อผ่าน LINE OA</h3>
                <p className="text-sm text-gray-600 mb-6 line-clamp-2">
                  ช่องทางที่รวดเร็วที่สุด มีแอดมินคอยตอบคำถามและช่วยเหลือตลอดเวลาทำการ
                </p>
                <a
                  href="https://line.me/ti/p/~@211nxlbp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 bg-[#00B900] hover:bg-[#009900] text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  แชทเลย
                </a>
              </div>

              {/* Email / Address */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-6">ช่องทางอื่นๆ</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">📧</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">อีเมล</p>
                      <a href="mailto:support@smartrent.co" className="text-primary hover:underline text-sm mt-0.5 inline-block">
                        support@smartrent.co
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">🕒</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">เวลาทำการ</p>
                      <p className="text-gray-600 text-sm mt-0.5">
                        จันทร์ - ศุกร์: 09:00 - 18:00<br/>
                        เสาร์ - อาทิตย์: 10:00 - 17:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
