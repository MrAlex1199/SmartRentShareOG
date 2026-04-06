'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Layout/Header';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface UserItem {
  _id: string;
  displayName: string;
  pictureUrl?: string;
  lineId: string;
  email?: string;
  role: 'student' | 'admin';
  status: 'active' | 'banned';
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  verification?: { status: string };
}

function fmtDate(d: string) {
  return format(new Date(d), 'd MMM yyyy', { locale: th });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const LIMIT = 20;
  const token = Cookies.get('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchUsers = useCallback(async () => {
    if (!token) { router.push('/'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/admin/list?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { router.push('/'); return; }
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, search, router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleSetStatus = async (userId: string, status: 'active' | 'banned') => {
    const confirmMsg = status === 'banned' ? 'ยืนยันแบนผู้ใช้คนนี้?' : 'ยืนยันปลดแบนผู้ใช้คนนี้?';
    if (!confirm(confirmMsg)) return;
    setActionLoading(userId + status);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/status`, {
        method: 'PATCH', headers, body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status } : u));
      } else {
        const err = await res.json();
        alert(err.message || 'เกิดข้อผิดพลาด');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    const confirmMsg = newRole === 'admin' ? 'ยืนยัน Promote เป็น Admin?' : 'ยืนยัน Demote เป็น Student?';
    if (!confirm(confirmMsg)) return;
    setActionLoading(userId + 'role');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/role`, {
        method: 'PATCH', headers, body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole as 'student' | 'admin' } : u));
      } else {
        const err = await res.json();
        alert(err.message || 'เกิดข้อผิดพลาด');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <button onClick={() => router.push('/admin')} className="flex items-center gap-1 text-sm text-gray-500 mb-1 hover:text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Admin Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">👥 จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-gray-500 mt-1">ผู้ใช้ทั้งหมด {total.toLocaleString()} คน</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้..."
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-56"
            />
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
              ค้นหา
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-gray-500">ไม่พบผู้ใช้งาน</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ผู้ใช้</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">บทบาท</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">สถานะ</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ยืนยันตัวตน</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">สมัครเมื่อ</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {u.pictureUrl
                              ? <img src={u.pictureUrl} alt={u.displayName} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">{u.displayName[0]}</div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[160px]">{u.displayName}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[160px]">
                              {u.email || `LINE: ${u.lineId.slice(0, 12)}...`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? '👑 Admin' : '👤 Student'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.status === 'banned' ? '🚫 Banned' : '✅ Active'}
                        </span>
                      </td>

                      {/* Verification */}
                      <td className="px-4 py-3">
                        {u.isVerified
                          ? <span className="text-xs text-blue-600 font-medium">✓ ยืนยันแล้ว</span>
                          : <span className="text-xs text-gray-400">ยังไม่ยืนยัน</span>
                        }
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(u.createdAt)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ban / Unban */}
                          <button
                            onClick={() => handleSetStatus(u._id, u.status === 'banned' ? 'active' : 'banned')}
                            disabled={actionLoading === u._id + 'active' || actionLoading === u._id + 'banned'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                              u.status === 'banned'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {actionLoading?.startsWith(u._id) && (actionLoading === u._id + 'active' || actionLoading === u._id + 'banned')
                              ? '...'
                              : u.status === 'banned' ? '✓ ปลดแบน' : '🚫 แบน'
                            }
                          </button>

                          {/* Promote / Demote */}
                          <button
                            onClick={() => handleSetRole(u._id, u.role)}
                            disabled={actionLoading === u._id + 'role'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                              u.role === 'admin'
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            {actionLoading === u._id + 'role'
                              ? '...'
                              : u.role === 'admin' ? '↓ เป็น Student' : '↑ เป็น Admin'
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">แสดง {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} จาก {total} คน</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                ← ก่อนหน้า
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">หน้า {page}/{totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
