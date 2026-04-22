'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { AuthLib } from '@/lib/auth';
import { NotificationBell } from '@/components/Notifications/NotificationBell';

interface UserProfile {
  _id?: string;
  displayName: string;
  pictureUrl?: string;
  role?: string;
}

export function Header() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      setIsAuthenticated(!!token);

      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const user = await response.json();
            setUserProfile({ _id: user._id, displayName: user.displayName, pictureUrl: user.pictureUrl, role: user.role });
          }
        } catch { /* ignore */ }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try { await AuthLib.loginWithLine(); } catch { /* ignore */ }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setShowDropdown(false);
    AuthLib.logout();
  };

  const navLink = (href: string, label: string, exact = false, excludePrefixes: string[] = []) => {
    const active = exact
      ? pathname === href
      : pathname.startsWith(href) && !excludePrefixes.some(p => pathname.startsWith(p));
    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'text-primary bg-primary/10' : 'text-gray-700 hover:text-primary hover:bg-gray-50'}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Desktop layout (≥ lg) ── */}
        <div className="hidden lg:flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-400 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-xl font-bold text-gray-900">🏠</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Smart Rent &amp; Share</span>
          </Link>

          {/* Desktop nav */}
          <nav className="flex items-center gap-1">
            {navLink('/', 'หน้าแรก', true)}
            {!loading && isAuthenticated && (
              <>
                {navLink('/bookings', 'การจองของฉัน', false, ['/bookings/requests'])}
                {navLink('/bookings/requests', 'คำขอจอง')}
                {navLink('/dashboard', 'สินค้าของฉัน')}
                {userProfile?.role === 'admin' && navLink('/admin', '👑 Admin')}
                <Link href="/items/create" className="ml-1 px-4 py-2 bg-primary text-gray-900 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                  + ลงประกาศ
                </Link>
                <NotificationBell />
                {/* Avatar dropdown */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={userProfile?.pictureUrl || 'https://via.placeholder.com/40'}
                      alt={userProfile?.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                    />
                    <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">{userProfile?.displayName || 'User'}</span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                        <DropdownLink href="/profile" icon="👤" label="โปรไฟล์ของฉัน" onClick={() => setShowDropdown(false)} />
                        <DropdownLink href="/bookings" icon="📋" label="การจองของฉัน" onClick={() => setShowDropdown(false)} />
                        <DropdownLink href="/bookings/requests" icon="🔔" label="คำขอจอง" onClick={() => setShowDropdown(false)} />
                        {userProfile?.role === 'admin' && (
                          <DropdownLink href="/admin" icon="👑" label="Admin Panel" onClick={() => setShowDropdown(false)} />
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                            <span>🚪</span> ออกจากระบบ
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            {!loading && !isAuthenticated && (
              <button onClick={handleLogin} className="px-4 py-2 bg-[#00B900] text-white rounded-lg text-sm font-semibold hover:bg-[#009900] transition-colors shadow-sm flex items-center gap-2">
                <LineIcon /> เข้าสู่ระบบ
              </button>
            )}
          </nav>
        </div>

        {/* ── Mobile layout (< lg) — compact top bar ── */}
        <div className="flex lg:hidden justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-base">🏠</span>
            </div>
            <span className="text-base font-bold text-gray-900">SmartRent</span>
          </Link>

          {/* Right side: notification + avatar or login */}
          <div className="flex items-center gap-1">
            {!loading && isAuthenticated ? (
              <>
                <NotificationBell />
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={userProfile?.pictureUrl || 'https://via.placeholder.com/32'}
                    alt={userProfile?.displayName || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                  />
                </button>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-4 top-14 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{userProfile?.displayName}</p>
                        {userProfile?.role === 'admin' && <p className="text-xs text-primary font-medium">Admin</p>}
                      </div>
                      <DropdownLink href="/profile" icon="👤" label="โปรไฟล์" onClick={() => setShowDropdown(false)} />
                      <DropdownLink href="/dashboard" icon="📦" label="สินค้าของฉัน" onClick={() => setShowDropdown(false)} />
                      {userProfile?.role === 'admin' && (
                        <DropdownLink href="/admin" icon="👑" label="Admin Panel" onClick={() => setShowDropdown(false)} />
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                          <span>🚪</span> ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : !loading && (
              <button onClick={handleLogin} className="px-3 py-1.5 bg-[#00B900] text-white rounded-lg text-sm font-semibold hover:bg-[#009900] transition-colors flex items-center gap-1.5">
                <LineIcon size={16} /> เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

/* Small reusable components */
function DropdownLink({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <span>{icon}</span> {label}
    </Link>
  );
}

function LineIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}
