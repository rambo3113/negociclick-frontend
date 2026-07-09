'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Loader2, Search, AlertTriangle, CheckCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  city: string;
  status: string;
  plan: string;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  subscription: { plan: string; status: string; isTrial: boolean; nextRenewal: string | null } | null;
  _count: { bookings: number; services: number };
}

const PLAN_COLORS: Record<string, string> = {
  FREE:    'bg-gray-700 text-gray-300',
  PRO:     'bg-indigo-900/60 text-indigo-300 border border-indigo-700',
  PREMIUM: 'bg-amber-900/60 text-amber-300 border border-amber-700',
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [filterPlan, setFilterPlan]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [suspendId, setSuspendId]   = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search)       params.set('search', search);
    if (filterPlan)   params.set('plan', filterPlan);
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/admin/businesses?${params}`)
      .then(r => { setBusinesses(r.data.businesses); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterPlan, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async () => {
    if (!suspendId) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/businesses/${suspendId}/suspend`, { reason: suspendReason });
      setSuspendId(null); setSuspendReason('');
      load();
    } finally { setActionLoading(false); }
  };

  const handleReactivate = async (id: string) => {
    setActionLoading(true);
    try { await api.post(`/admin/businesses/${id}/reactivate`); load(); }
    finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Negocios</h1>
          <p className="text-gray-500 text-sm">{total} en total</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre o email…"
              className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-xl pl-9 pr-4 py-2 w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
            <option value="">Todos los planes</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
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
                  <th className="text-left px-5 py-3 font-medium">Negocio</th>
                  <th className="text-left px-4 py-3 font-medium">Dueño</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium">Suscripción</th>
                  <th className="text-right px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {businesses.map(biz => (
                  <tr key={biz.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{biz.name}</p>
                      <p className="text-xs text-gray-500">{biz.city} · {biz._count.services} servicios · {biz._count.bookings} reservas</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-gray-200">{biz.owner.name}</p>
                      <p className="text-xs text-gray-500">{biz.owner.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${PLAN_COLORS[biz.plan] ?? PLAN_COLORS.FREE}`}>
                        {biz.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {biz.status === 'suspended' ? (
                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Suspendido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {biz.subscription ? (
                        <>
                          <span className="text-gray-300">{biz.subscription.plan}</span>
                          {biz.subscription.isTrial && <span className="ml-1 text-purple-400">(trial)</span>}
                          {biz.subscription.nextRenewal && (
                            <p className="text-gray-600 mt-0.5">
                              Vence {new Date(biz.subscription.nextRenewal).toLocaleDateString('es-PE')}
                            </p>
                          )}
                        </>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/businesses/${biz.id}`} target="_blank"
                          className="p-1.5 text-gray-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-800">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {biz.status === 'suspended' ? (
                          <button onClick={() => handleReactivate(biz.id)} disabled={actionLoading}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                            Reactivar
                          </button>
                        ) : (
                          <button onClick={() => setSuspendId(biz.id)}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-900 hover:border-red-800 px-3 py-1.5 rounded-lg transition-colors">
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {businesses.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-600">No hay negocios que coincidan</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal suspender */}
      {suspendId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-1">Suspender negocio</h3>
            <p className="text-sm text-gray-400 mb-4">Motivo de suspensión (visible en el log de auditoría)</p>
            <textarea
              value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
              rows={3} placeholder="Ej: Quejas reiteradas de clientes, contenido inapropiado…"
              className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => { setSuspendId(null); setSuspendReason(''); }}
                className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-xl text-sm hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSuspend} disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Suspender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
