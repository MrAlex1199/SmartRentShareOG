'use client';

import { useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface UserItem {
  _id: string;
  displayName: string;
  pictureUrl?: string;
  lineId: string;
  role: 'student' | 'admin';
  status: 'active' | 'banned';
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

export default function AdminUsersPage() {
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
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/admin/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleSetStatus = async (userId: string, status: 'active' | 'banned') => {
    if (!confirm(status === 'banned' ? 'ยืนยันแบนผู้ใช้คนนี้?' : 'ยืนยันปลดแบนผู้ใช้คนนี้?')) return;
    setActionLoading(userId + status);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/status`, {
        method: 'PATCH', headers, body: JSON.stringify({ status }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u._id === userId ? { ...u, status } : u));
      else alert((await res.json().catch(() => ({}))).message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!confirm(newRole === 'admin' ? 'ยืนยัน Promote เป็น Admin?' : 'ยืนยัน Demote เป็น Student?')) return;
    setActionLoading(userId + 'role');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/role`, {
        method: 'PATCH', headers, body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole as 'student' | 'admin' } : u));
      else alert((await res.json().catch(() => ({}))).message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 ผู้ใช้งาน</h1>
          <p className="text-sm text-gray-400 mt-1">ผู้ใช้ทั้งหมด {total.toLocaleString()} คน</p>
        </div>
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้..."
            className="w-52 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
          />
          <button type="submit" className="px-4 py-2 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-xl text-sm font-medium hover:bg-yellow-400/30 transition-all">
            ค้นหา
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:text-white transition-all">
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#1E2130] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-gray-400">ไม่พบผู้ใช้งาน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">บทบาท</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verify</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">สมัครเมื่อ</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-white/2 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0 ring-1 ring-white/10">
                          {u.pictureUrl
                            ? <img src={u.pictureUrl} alt={u.displayName} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{u.displayName[0]}</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate max-w-[160px]">{u.displayName}</p>
                          <p className="text-xs text-gray-600 truncate max-w-[160px]">LINE: {u.lineId.slice(0, 14)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        u.role === 'admin' ? 'bg-purple-400/15 text-purple-400 border-purple-400/20' : 'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        u.status === 'banned' ? 'bg-red-400/15 text-red-400 border-red-400/20' : 'bg-green-400/15 text-green-400 border-green-400/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'banned' ? 'bg-red-400' : 'bg-green-400'}`} />
                        {u.status === 'banned' ? 'Banned' : 'Active'}
                      </span>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-4 text-xs">
                      {u.isVerified
                        ? <span className="text-blue-400 font-medium">✓ ยืนยันแล้ว</span>
                        : <span className="text-gray-600">—</span>
                      }
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {format(new Date(u.createdAt), 'd MMM yy', { locale: th })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSetStatus(u._id, u.status === 'banned' ? 'active' : 'banned')}
                          disabled={!!actionLoading}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 ${
                            u.status === 'banned'
                              ? 'bg-green-400/10 text-green-400 border-green-400/20 hover:bg-green-400/20'
                              : 'bg-red-400/10 text-red-400 border-red-400/20 hover:bg-red-400/20'
                          }`}
                        >
                          {actionLoading?.startsWith(u._id) ? '...' : u.status === 'banned' ? '✓ ปลดแบน' : '🚫 แบน'}
                        </button>
                        <button
                          onClick={() => handleSetRole(u._id, u.role)}
                          disabled={!!actionLoading}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 ${
                            u.role === 'admin'
                              ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                              : 'bg-purple-400/10 text-purple-400 border-purple-400/20 hover:bg-purple-400/20'
                          }`}
                        >
                          {actionLoading === u._id + 'role' ? '...' : u.role === 'admin' ? '↓ Student' : '↑ Admin'}
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} จาก {total} คน
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-40 transition-all"
            >
              ← ก่อนหน้า
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">หน้า {page}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-40 transition-all"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
