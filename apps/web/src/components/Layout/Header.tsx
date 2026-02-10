'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthLib } from '@/lib/auth';
import Cookies from 'js-cookie';

export function Header() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      setIsAuthenticated(!!token);
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
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              Smart Rent & Share
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-4">
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
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-[#00B900] text-white rounded-lg text-sm font-semibold hover:bg-[#009900] transition-colors shadow-sm"
                  >
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
