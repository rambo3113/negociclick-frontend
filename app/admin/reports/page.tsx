'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  reportedBy: { id: string; name: string; email: string };
  reportedBusiness: { id: string; name: string } | null;
  reportedService:  { id: string; name: string } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports]       = useState<Report[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterStatus] = useState('open');
  const [resolving, setResolving]   = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (filterStatus) params.set('status', filterStatus);
    api.get(`/admin/reports?${params}`)
      .then(r => { setReports(r.data.reports); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try { await api.post(`/admin/reports/${id}/resolve`); load(); }
    finally { setResolving(null); }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Reportes</h1>
          <p className="text-gray-500 text-sm">{total} resultados</p>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
          <option value="">Todos</option>
          <option value="open">Abiertos</option>
          <option value="resolved">Resueltos</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-800" />
          <p>No hay reportes {filterStatus === 'open' ? 'abiertos' : 'en este estado'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id}
              className={`bg-gray-900 border rounded-2xl p-5 ${r.status === 'open' ? 'border-red-900/50' : 'border-gray-800'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'open' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {r.status === 'open' ? 'Abierto' : 'Resuelto'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(r.createdAt).toLocaleDateString('es-PE')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-200 mb-2 leading-relaxed">{r.reason}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>
                      Reportado por: <span className="text-gray-300">{r.reportedBy.name}</span>
                      <span className="ml-1 text-gray-600">({r.reportedBy.email})</span>
                    </span>
                    {r.reportedBusiness && (
                      <span className="flex items-center gap-1">
                        Negocio:
                        <Link href={`/businesses/${r.reportedBusiness.id}`} target="_blank"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                          {r.reportedBusiness.name} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </span>
                    )}
                    {r.reportedService && (
                      <span>Servicio: <span className="text-gray-300">{r.reportedService.name}</span></span>
                    )}
                  </div>
                </div>

                {r.status === 'open' && (
                  <button onClick={() => handleResolve(r.id)} disabled={resolving === r.id}
                    className="flex-shrink-0 flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
                    {resolving === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Marcar resuelto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
