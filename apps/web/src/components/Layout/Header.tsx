'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { AuthLib } from '@/lib/auth';

interface UserProfile {
  displayName: string;
  pictureUrl?: string;
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
        // Fetch user profile
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const user = await response.json();
            setUserProfile({
              displayName: user.displayName,
              pictureUrl: user.pictureUrl,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await AuthLib.loginWithLine();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-yellow-400 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-xl font-bold text-gray-900">🏠</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              Smart Rent & Share
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
              }`}
            >
              หน้าแรก
            </Link>
            
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/bookings"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/bookings' 
                          ? 'text-primary bg-primary/10' 
                          : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                      }`}
                    >
                      การจองของฉัน
                    </Link>
                    <Link 
                      href="/bookings/requests"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/bookings/requests' 
                          ? 'text-primary bg-primary/10' 
                          : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                      }`}
                    >
                      คำขอจอง
                    </Link>
                    <Link 
                      href="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === '/dashboard' 
                          ? 'text-primary bg-primary/10' 
                          : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                      }`}
                    >
                      ของฉัน
                    </Link>
                    <Link 
                      href="/items/create"
                      className="px-4 py-2 bg-primary text-gray-900 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
                    >
                      + ลงประกาศ
                    </Link>

                    {/* User Profile Dropdown */}
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
                        <span className="text-sm font-medium text-gray-900 hidden md:block max-w-[120px] truncate">
                          {userProfile?.displayName || 'User'}
                        </span>
                        <svg 
                          className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {showDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowDropdown(false)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">                            
                            <Link
                              href="/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              โปรไฟล์ของฉัน
                            </Link>
                            
                            <Link
                              href="/bookings"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              การจองของฉัน
                            </Link>
                            
                            <Link
                              href="/bookings/requests"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              คำขอจอง
                            </Link>

                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                ออกจากระบบ
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-[#00B900] text-white rounded-lg text-sm font-semibold hover:bg-[#009900] transition-colors shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    เข้าสู่ระบบ
                  </button>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
