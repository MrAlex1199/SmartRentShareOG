'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin/overview', icon: BarChartIcon, label: 'ภาพรวม' },
  { href: '/admin/payments', icon: CreditCardIcon, label: 'Payments' },
  { href: '/admin/verifications', icon: ShieldCheckIcon, label: 'ยืนยันตัวตน' },
  { href: '/admin/users', icon: UsersIcon, label: 'ผู้ใช้งาน' },
  { href: '/admin/disputes', icon: AlertIcon, label: 'Disputes' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPic, setUserPic] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : null).then(u => {
      if (u) { setUserName(u.displayName); setUserPic(u.pictureUrl || ''); }
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/admin/overview" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-lg">👑</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Admin Panel</p>
            <p className="text-gray-400 text-xs mt-0.5">SmartRent&amp;Share</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">จัดการ</p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} active={active} />
              {label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-white/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">ลิงก์</p>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <HomeIcon size={18} active={false} />
            กลับหน้าเว็บ
          </Link>
        </div>
      </nav>

      {/* User profile at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
            {userPic
              ? <img src={userPic} alt={userName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{userName[0]}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName || 'Admin'}</p>
            <p className="text-yellow-400 text-xs">Administrator</p>
          </div>
          <button onClick={handleLogout} title="ออกจากระบบ" className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
            <LogoutIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#0F1117] min-h-screen flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F1117] border-b border-white/10 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-gray-300 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <span className="text-xs">👑</span>
          </div>
          <span className="text-white text-sm font-bold">Admin Panel</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0F1117] lg:hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-white font-bold">Admin Panel</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

/* ── Icon Components ── */
type IconProps = { size: number; active: boolean };

function BarChartIcon({ size, active }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="2" y="13" width="4" height="8" rx="1"/></svg>;
}
function CreditCardIcon({ size, active }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
}
function ShieldCheckIcon({ size, active }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
}
function UsersIcon({ size, active }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function AlertIcon({ size, active }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function HomeIcon({ size, active }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function LogoutIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
