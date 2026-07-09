'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  userId: string | null;
  targetId: string | null;
  meta: string | null;
  ip: string | null;
  createdAt: string;
}

const ACTION_COLOR: Record<string, string> = {
  SUSPEND_BUSINESS:    'bg-red-900/50 text-red-400',
  REACTIVATE_BUSINESS: 'bg-emerald-900/50 text-emerald-400',
  ROLE_CHANGE:         'bg-purple-900/50 text-purple-400',
  VIEW_REPORT:         'bg-gray-800 text-gray-500',
  RESOLVE_REPORT:      'bg-blue-900/50 text-blue-400',
};

export default function AdminLogsPage() {
  const [logs, setLogs]         = useState<Log[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [filterAction, setFilterAction] = useState('');

  const ACTIONS = ['SUSPEND_BUSINESS', 'REACTIVATE_BUSINESS', 'ROLE_CHANGE', 'RESOLVE_REPORT', 'VIEW_REPORT'];

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (filterAction) params.set('action', filterAction);
    api.get(`/admin/logs?${params}`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterAction]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Auditoría</h1>
          <p className="text-gray-500 text-sm">{total} entradas</p>
        </div>
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
          <option value="">Todas las acciones</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Acción</th>
                  <th className="text-left px-4 py-3 font-medium">Target</th>
                  <th className="text-left px-4 py-3 font-medium">Detalles</th>
                  <th className="text-left px-4 py-3 font-medium">IP</th>
                  <th className="text-left px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {logs.map(log => {
                  let meta: Record<string, any> = {};
                  try { if (log.meta) meta = JSON.parse(log.meta); } catch {}
                  return (
                    <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${ACTION_COLOR[log.action] ?? 'bg-gray-800 text-gray-400'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {log.targetId ? log.targetId.slice(0, 12) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                        {Object.keys(meta).length > 0
                          ? Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(' · ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.ip ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('es-PE', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-600">Sin entradas de auditoría</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
