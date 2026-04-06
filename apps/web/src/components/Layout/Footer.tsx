import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden lg:block bg-gray-900 text-gray-300 mt-auto">
      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-xl">🏠</span>
              </div>
              <span className="text-white font-bold text-lg leading-tight">
                Smart Rent<br />
                <span className="text-yellow-400">&amp; Share</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              แพลตฟอร์มเช่า-ยืมสินค้าระหว่างนักศึกษา ปลอดภัย โปร่งใส และง่ายต่อการใช้งาน
            </p>

            {/* LINE OA Contact */}
            <a
              href="https://line.me/ti/p/~@211nxlbp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B900] hover:bg-[#009900] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <LineIcon size={16} />
              ติดต่อทาง LINE OA
            </a>
          </div>

          {/* Col 2: Explore */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">สำรวจ</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/" label="หน้าแรก" />
              <FooterLink href="/search" label="ค้นหาสินค้า" />
              <FooterLink href="/items/create" label="ลงประกาศให้เช่า" />
              <FooterLink href="/bookings" label="การจองของฉัน" />
              <FooterLink href="/bookings/requests" label="คำขอจองที่รับ" />
            </ul>
          </div>

          {/* Col 3: Account */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">บัญชีของฉัน</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/profile" label="โปรไฟล์" />
              <FooterLink href="/dashboard" label="Dashboard สินค้า" />
              <FooterLink href="/dashboard/payouts" label="ประวัติรับเงิน" />
            </ul>

            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 mt-7">ช่วยเหลือ</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/help" label="วิธีใช้งาน" />
              <FooterLink href="/help/safety" label="ความปลอดภัย" />
              <FooterLink href="/contact" label="ติดต่อเรา" />
            </ul>
          </div>

          {/* Col 4: Trust */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">ทำไมต้อง SmartRent?</h3>
            <ul className="space-y-3">
              {[
                { icon: '🔒', text: 'ระบบ Escrow ป้องกันการโกง' },
                { icon: '⭐', text: 'รีวิวจากผู้เช่าจริง' },
                { icon: '🪪', text: 'ยืนยันตัวตนทุกคน' },
                { icon: '💬', text: 'แชทในแอปได้เลย' },
                { icon: '📲', text: 'แจ้งเตือนผ่าน LINE ทันที' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {year} Smart Rent &amp; Share. สงวนลิขสิทธิ์.
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">เงื่อนไขการใช้งาน</Link>
            <Link href="/cookies" className="hover:text-gray-300 transition-colors">นโยบาย Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
        {label}
      </Link>
    </li>
  );
}

function LineIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}
