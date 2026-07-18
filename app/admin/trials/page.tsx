'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Trial {
  subscriptionId: string;
  businessId:     string | null;
  businessName:   string;
  ownerEmail:     string;
  ownerName:      string;
  planType:       string;
  status:         string;
  startDate:      string;
  endDate:        string | null;
  daysRemaining:  number | null;
  trialGrantedAt: string | null;
  trialReason:    string | null;
  converted:      boolean;
}

interface Stats {
  totalTrialsGiven:   number;
  activeTrials:       number;
  convertedToPayment: number;
  conversionRate:     string;
  revenuePostTrial:   string;
  trialsByPlan:       Record<string, number>;
}

interface Business { 
  id: string
  name: string 
  category?: string
  city?: string
  ownerEmail?: string 
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: 'Activo',    color: 'bg-green-100 text-green-800' },
  EXPIRED:   { label: 'Expirado',  color: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Revocado',  color: 'bg-red-100 text-red-700' },
};

const PLAN_META: Record<string, { color: string; icon: string }> = {
  PRO:     { color: 'text-indigo-600', icon: '👑' },
  PREMIUM: { color: 'text-amber-600',  icon: '✨' },
};

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getAuthHeaders() {
  const token = Cookies.get('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  };
}

export default function AdminTrialsPage() {
  const { token } = useAuth();
  const [tab, setTab]               = useState<'active' | 'history' | 'grant'>('active');
  const [stats, setStats]           = useState<Stats | null>(null);
  const [trials, setTrials]         = useState<Trial[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [loading, setLoading]       = useState(true);

  // Grant form
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bizSearch, setBizSearch]   = useState('');
  const [bizResults, setBizResults] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [grantPlan, setGrantPlan]   = useState<'PRO' | 'PREMIUM'>('PRO');
  const [grantDays, setGrantDays]   = useState(90);
  const [grantReason, setGrantReason] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMsg, setGrantMsg]     = useState('');

  // Revoke
  const [revokeTarget, setRevokeTarget] = useState<Trial | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Extend
  const [extendTarget, setExtendTarget] = useState<Trial | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendMsg, setExtendMsg]   = useState('');

  const limit = 20;

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    fetchTrials();
  }, [page, statusFilter]);

  // Search businesses debounced
  useEffect(() => {
    if (!bizSearch.trim()) { setBizResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`${API}/businesses?search=${encodeURIComponent(bizSearch)}&limit=8`, { headers: getAuthHeaders() });
      const d = await res.json();
      setBizResults(d.businesses ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [bizSearch]);

  async function fetchStats() {
    const res = await fetch(`${API}/admin/trials/stats`, { headers: getAuthHeaders() });
    const d = await res.json();
    setStats(d.stats ?? null);
  }

  async function fetchTrials() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), status: statusFilter });
      const res = await fetch(`${API}/admin/trials?${params}`, { headers: getAuthHeaders() });
      const d = await res.json();
      setTrials(d.trials ?? []);
      setTotal(d.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  async function handleGrant() {
    if (!selectedBiz) { setGrantMsg('Selecciona un negocio'); return; }
    setGrantLoading(true);
    setGrantMsg('');
    try {
      const res = await fetch(`${API}/admin/trials/grant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ businessId: selectedBiz.id, planType: grantPlan, durationDays: grantDays, reason: grantReason || undefined }),
      });
      const d = await res.json();
      if (!res.ok) { setGrantMsg(`Error: ${d.error}`); return; }
      setGrantMsg(`✅ Trial ${grantPlan} de ${grantDays} días asignado a ${selectedBiz.name}`);
      setSelectedBiz(null); setBizSearch(''); setGrantReason('');
      fetchStats(); if (statusFilter === 'ACTIVE') fetchTrials();
    } finally {
      setGrantLoading(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget?.businessId) return;
    setRevokeLoading(true);
    try {
      const res = await fetch(`${API}/admin/trials/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ businessId: revokeTarget.businessId }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error); return; }
      setRevokeTarget(null);
      fetchStats(); fetchTrials();
    } finally {
      setRevokeLoading(false);
    }
  }

  async function handleExtend() {
    if (!extendTarget?.businessId) return;
    setExtendLoading(true);
    setExtendMsg('');
    try {
      const res = await fetch(`${API}/admin/trials/extend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ businessId: extendTarget.businessId, extraDays: extendDays }),
      });
      const d = await res.json();
      if (!res.ok) { setExtendMsg(d.error); return; }
      setExtendMsg(`✅ Trial extendido ${extendDays} días más.`);
      setTimeout(() => { setExtendTarget(null); setExtendMsg(''); fetchTrials(); fetchStats(); }, 1500);
    } finally {
      setExtendLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Trials</h1>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total asignados', value: stats.totalTrialsGiven, color: 'text-gray-900' },
              { label: 'Activos ahora',   value: stats.activeTrials,     color: 'text-green-600' },
              { label: 'Convertidos',     value: `${stats.convertedToPayment} (${stats.conversionRate})`, color: 'text-indigo-600' },
              { label: 'Ingresos post-trial', value: stats.revenuePostTrial, color: 'text-emerald-600' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="flex gap-3 mb-6 text-sm text-gray-600">
            {Object.entries(stats.trialsByPlan).map(([plan, count]) => (
              <span key={plan} className={`font-semibold ${PLAN_META[plan]?.color ?? ''}`}>
                {PLAN_META[plan]?.icon} {plan}: {count} activo{count !== 1 ? 's' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: 'active',  label: 'Trials activos' },
            { key: 'history', label: 'Historial' },
            { key: 'grant',   label: '+ Asignar trial' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Grant ────────────────────────────────────────────────────── */}
        {tab === 'grant' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
            <h2 className="font-bold text-gray-900 mb-5">Asignar trial manual</h2>

            {/* Business search */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">Negocio</label>
              {selectedBiz && selectedBiz.id ? (
                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-950 border-2 border-indigo-950 rounded-xl px-4 py-3 shadow-lg">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{selectedBiz.name}</div>
                    {selectedBiz.category && <div className="text-xs text-indigo-200">{selectedBiz.category}</div>}
                  </div>
                  <button 
                    onClick={() => { setSelectedBiz(null); setBizSearch(''); setBizResults([]); }}
                    className="ml-3 flex-shrink-0 text-white hover:text-yellow-300 hover:bg-indigo-800 rounded-full w-6 h-6 flex items-center justify-center font-bold transition-all"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={bizSearch}
                    onChange={e => setBizSearch(e.target.value)}
                    placeholder="Buscar negocio por nombre..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  {bizSearch.length > 0 && bizResults.length === 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                      No se encontraron negocios
                    </div>
                  )}
                  {bizResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-indigo-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {bizResults.map(b => (
                        <button
                          key={b.id}
                          onClick={() => { setSelectedBiz(b); setBizSearch(''); setBizResults([]); }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-indigo-50 border-b border-gray-100 last:border-0 transition-colors font-medium"
                        >
                          <div className="font-semibold">{b.name}</div>
                          <div className="text-xs text-gray-500">
                            {b.category && `${b.category} • `}
                            {b.city || 'Lima'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Plan */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <div className="flex gap-2">
                {(['PRO', 'PREMIUM'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setGrantPlan(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      grantPlan === p
                        ? p === 'PREMIUM' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {PLAN_META[p].icon} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
              <div className="flex gap-2">
                {[{ days: 60, label: '2 meses' }, { days: 90, label: '3 meses' }, { days: 180, label: '6 meses' }].map(d => (
                  <button
                    key={d.days}
                    onClick={() => setGrantDays(d.days)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      grantDays === d.days
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón <span className="text-gray-400">(opcional)</span></label>
              <input
                type="text"
                value={grantReason}
                onChange={e => setGrantReason(e.target.value)}
                placeholder="ej: acquisition_pedidosya, referral, demo"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {grantMsg && (
              <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${grantMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {grantMsg}
              </div>
            )}

            <button
              disabled={!selectedBiz || grantLoading}
              onClick={handleGrant}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {grantLoading ? 'Asignando...' : `Asignar trial ${grantPlan} · ${grantDays} días`}
            </button>
          </div>
        )}

        {/* ── Tab: Active / History ─────────────────────────────────────────── */}
        {(tab === 'active' || tab === 'history') && (
          <>
            {tab === 'history' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {['ACTIVE', 'EXPIRED', 'CANCELLED'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      statusFilter === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {STATUS_META[s]?.label ?? s}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="text-center py-16 text-gray-400">Cargando...</div>
            ) : trials.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No hay trials en este estado.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Negocio</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vence</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Razón</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trials.map(t => {
                      const sm   = STATUS_META[t.status] ?? { label: t.status, color: 'bg-gray-100 text-gray-600' };
                      const pm   = PLAN_META[t.planType] ?? { color: '', icon: '' };
                      const warn = t.status === 'ACTIVE' && t.daysRemaining !== null && t.daysRemaining <= 3;
                      return (
                        <tr key={t.subscriptionId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{t.businessName}</p>
                            <p className="text-xs text-gray-400">{t.ownerEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${pm.color}`}>{pm.icon} {t.planType}</span>
                            {t.converted && (
                              <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Convirtió</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700">{t.endDate ? fmtDate(t.endDate) : '—'}</p>
                            {t.daysRemaining !== null && t.status === 'ACTIVE' && (
                              <p className={`text-xs font-semibold mt-0.5 ${warn ? 'text-red-600' : 'text-gray-400'}`}>
                                {warn ? '⚠ ' : ''}{t.daysRemaining} días rest.
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${sm.color}`}>
                              {sm.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{t.trialReason ?? '—'}</td>
                          <td className="px-4 py-3">
                            {t.status === 'ACTIVE' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setExtendTarget(t); setExtendDays(30); setExtendMsg(''); }}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                                >
                                  Extender
                                </button>
                                <button
                                  onClick={() => setRevokeTarget(t)}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                  Revocar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
                <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Revoke modal ─────────────────────────────────────────────────────── */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">¿Revocar trial?</h3>
            <p className="text-sm text-gray-600 mb-1">
              Negocio: <strong>{revokeTarget.businessName}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-5">
              El negocio pasará a plan FREE inmediatamente y recibirá un email de notificación.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRevokeTarget(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleRevoke} disabled={revokeLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {revokeLoading ? 'Revocando...' : 'Sí, revocar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend modal ──────────────────────────────────────────────────────── */}
      {extendTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Extender trial</h3>
            <p className="text-sm text-gray-600 mb-4">
              Negocio: <strong>{extendTarget.businessName}</strong><br/>
              Vence actualmente: <strong>{extendTarget.endDate ? fmtDate(extendTarget.endDate) : '—'}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días a agregar</label>
            <div className="flex gap-2 mb-5">
              {[7, 14, 30, 60].map(d => (
                <button key={d} onClick={() => setExtendDays(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    extendDays === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  +{d}d
                </button>
              ))}
            </div>
            {extendMsg && <p className="text-sm text-green-600 mb-3">{extendMsg}</p>}
            <div className="flex gap-3">
              <button onClick={() => setExtendTarget(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleExtend} disabled={extendLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {extendLoading ? 'Extendiendo...' : `Extender +${extendDays} días`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
