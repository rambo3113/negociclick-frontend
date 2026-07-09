'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Sub {
  id: string;
  plan: string;
  status: string;
  isTrial: boolean;
  price: number;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  user: { name: string; email: string };
  business: { id: string; name: string } | null;
}

const PLAN_COLORS: Record<string, string> = {
  PRO:     'bg-indigo-900/60 text-indigo-300 border border-indigo-700',
  PREMIUM: 'bg-amber-900/60 text-amber-300 border border-amber-700',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'text-emerald-400',
  CANCELLED: 'text-red-400',
  EXPIRED:   'text-gray-500',
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]         = useState<Sub[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [filterPlan, setFilterPlan]     = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filterPlan)   params.set('plan', filterPlan);
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/admin/subscriptions?${params}`)
      .then(r => { setSubs(r.data.subscriptions); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterPlan, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Suscripciones</h1>
          <p className="text-gray-500 text-sm">{total} resultados</p>
        </div>
        <div className="flex gap-3">
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
            <option value="">Todos los planes</option>
            <option value="PRO">PRO</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="EXPIRED">Expiradas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Negocio / Dueño</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium">Monto</th>
                  <th className="text-left px-4 py-3 font-medium">Inicio</th>
                  <th className="text-left px-4 py-3 font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subs.map(s => (
                  <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{s.business?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{s.user.name} · {s.user.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${PLAN_COLORS[s.plan] ?? ''}`}>
                        {s.plan}
                      </span>
                      {s.isTrial && <span className="ml-1.5 text-xs text-purple-400">(trial)</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold ${STATUS_COLORS[s.status] ?? 'text-gray-400'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-300">
                      S/ {s.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {new Date(s.startDate).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {s.endDate ? new Date(s.endDate).toLocaleDateString('es-PE') : '—'}
                      {!s.autoRenew && <span className="ml-1 text-gray-600">(no renueva)</span>}
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-600">Sin suscripciones</td></tr>
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
