'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { router.push('/'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (!user || user.role !== 'admin') {
          router.push('/');
        } else {
          setChecking(false);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-gray-400 text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0D14]">
      <AdminSidebar />
      {/* Content area — offset on mobile for topbar */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
