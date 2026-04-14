'use client';

import { useEffect, useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface AuditLog {
  _id: string;
  action: string;
  actor: string;
  actorRole: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Quick apply filters
  const [activeActionFilter, setActiveActionFilter] = useState('');
  const [activeActorFilter, setActiveActorFilter] = useState('');
  const [activeDateFrom, setActiveDateFrom] = useState('');
  const [activeDateTo, setActiveDateTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const LIMIT = 30;
  const token = Cookies.get('token');

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeActionFilter) params.set('action', activeActionFilter);
      if (activeActorFilter) params.set('actor', activeActorFilter);
      if (activeDateFrom) params.set('from', activeDateFrom);
      if (activeDateTo) params.set('to', activeDateTo);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, activeActionFilter, activeActorFilter, activeDateFrom, activeDateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveActionFilter(actionFilter);
    setActiveActorFilter(actorFilter);
    setActiveDateFrom(dateFrom);
    setActiveDateTo(dateTo);
  };

  const handleClearFilters = () => {
    setActionFilter(''); setActorFilter(''); setDateFrom(''); setDateTo('');
    setActiveActionFilter(''); setActiveActorFilter(''); setActiveDateFrom(''); setActiveDateTo('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  // Helpers
  const getActionColor = (action: string) => {
    if (action.includes('error') || action.includes('cancel') || action.includes('reject') || action.includes('ban'))
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (action.includes('success') || action.includes('approve') || action.includes('verified') || action.includes('created'))
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (action.includes('login') || action.includes('session'))
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-gray-300 bg-white/5 border-white/10';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📜 Audit Log</h1>
        <p className="text-sm text-gray-400 mt-1">ประวัติการกระทำในระบบทั้งหมด (ข้อมูลย้อนหลัง 2 ปีตาม PDPA)</p>
      </div>

      {/* Filters */}
      <div className="bg-[#1E2130] rounded-2xl border border-white/5 p-5">
        <form onSubmit={handleApplyFilters} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-400">Action (คำค้นหา)</label>
            <input
              type="text"
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              placeholder="เช่น booking.created"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-400">Actor ID</label>
            <input
              type="text"
              value={actorFilter}
              onChange={e => setActorFilter(e.target.value)}
              placeholder="User ID หรือ system"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-gray-600"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-gray-400">ตั้งแต่ (From)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-gray-400">ถึง (To)</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="px-5 py-2 min-h-[38px] bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-xl text-sm font-semibold hover:bg-yellow-400/30 transition-all">
              Filter
            </button>
            {(activeActionFilter || activeActorFilter || activeDateFrom || activeDateTo) && (
              <button type="button" onClick={handleClearFilters} className="px-5 py-2 min-h-[38px] bg-white/5 border border-white/10 text-gray-400 rounded-xl text-sm hover:text-white transition-all">
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#1E2130] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">ไม่พบข้อมูล Audit Log</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">วัน-เวลา</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Metadata (ย่อ)</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-white/5 transition-colors font-mono text-[13px]">
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd/MM/yy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-xs ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${log.actorRole === 'admin' ? 'bg-purple-400' : log.actorRole === 'system' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                        <span className="truncate max-w-[120px]" title={log.actor}>{log.actor === 'system' ? 'SYSTEM' : log.actor.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {log.targetType ? `${log.targetType} ${log.targetId ? `(${log.targetId.slice(-6)})` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                      {log.metadata ? JSON.stringify(log.metadata).replace(/[{}]/g, '') : '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                      >
                        ดูเต็ม
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} จากทั้งหมด {total.toLocaleString()} รายการ
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setSelectedLog(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#1E2130] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative">
            <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h3 className="text-lg font-bold text-white mb-4">Audit Log Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-mono">
              <div>
                <p className="text-gray-500 text-xs mb-1">Log ID</p>
                <p className="text-gray-300">{selectedLog._id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Timestamp</p>
                <p className="text-gray-300">{format(new Date(selectedLog.createdAt), 'dd MMMM yyyy HH:mm:ss', { locale: th })}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Action</p>
                <span className={`px-2 py-0.5 rounded border text-xs ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">IP Address</p>
                <p className="text-gray-300">{selectedLog.ipAddress || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Actor ID ({selectedLog.actorRole})</p>
                <p className="text-gray-300">{selectedLog.actor}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Target</p>
                <p className="text-gray-300">{selectedLog.targetType || '-'} {selectedLog.targetId}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-gray-500 text-xs font-mono mb-1">Metadata (JSON)</p>
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto">
                <pre className="text-[13px] text-green-400 font-mono m-0">
                  {selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
