'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Users, Store, Calendar, CreditCard, Crown, Zap, Sparkles,
  ShieldCheck, Loader2, Star, ChevronDown, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface Stats {
  users:         { total: number; byRole: Record<string, number> };
  businesses:    { total: number };
  bookings:      { total: number; byStatus: Record<string, number> };
  payments:      { total: number; paid: number; totalRevenue: number };
  subscriptions: { active: Record<string, number> };
}
interface RecentBooking {
  id: string; date: string; status: string; totalAmount: number;
  client: { name: string; email: string };
  business: { name: string };
  service:  { name: string };
}
interface AdminUser {
  id: string; name: string; email: string; role: string; phone?: string; createdAt: string;
}
interface AdminBusiness {
  id: string; name: string; category: string; city: string; isActive: boolean; featured: boolean; createdAt: string;
  owner: { name: string; email: string };
  _count: { bookings: number; reviews: number; services: number };
}
interface FeaturedPayment {
  id: string; period: string; days: number; amount: string; culqiChargeId: string;
  featuredUntil: string; createdAt: string;
  business: { name: string };
  user: { name: string; email: string };
}

// ── Constants ───────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};

type Tab = 'overview' | 'users' | 'businesses' | 'featured';

// ── Component ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats]               = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [allUsers, setAllUsers]         = useState<AdminUser[]>([]);
  const [businesses, setBusinesses]     = useState<AdminBusiness[]>([]);
  const [featuredPayments, setFeaturedPayments] = useState<FeaturedPayment[]>([]);
  const [featuredTotal, setFeaturedTotal] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<Tab>('overview');
  const [roleLoading, setRoleLoading]   = useState<string | null>(null);
  const [bizLoading, setBizLoading]     = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user)              { router.push('/login'); return; }
    if (!authLoading && user?.role !== 'ADMIN') { router.push('/');     return; }
    if (user?.role === 'ADMIN') {
      Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/businesses'),
        api.get('/admin/featured-payments'),
      ]).then(([s, u, b, f]) => {
        setStats(s.data.stats);
        setRecentBookings(s.data.recentBookings);
        setAllUsers(u.data.users);
        setBusinesses(b.data.businesses);
        setFeaturedPayments(f.data.payments);
        setFeaturedTotal(f.data.total);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch { /* silent */ } finally { setRoleLoading(null); }
  };

  const handleToggleBusiness = async (bizId: string) => {
    setBizLoading(bizId);
    try {
      const res = await api.put(`/admin/businesses/${bizId}/toggle`);
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, isActive: res.data.isActive } : b));
    } catch { /* silent */ } finally { setBizLoading(null); }
  };

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-gray-500 text-sm">Cargando panel admin...</p>
      </div>
    </div>
  );

  if (!stats) return null;
  const { users, businesses: bizStats, bookings, payments, subscriptions } = stats;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-semibold uppercase tracking-wider">Panel Admin</span>
            </div>
            <h1 className="text-3xl font-black">NegociClick</h1>
            <p className="text-white/50 text-sm mt-1">Control total de la plataforma</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs">Ingresos por reservas</p>
            <p className="text-4xl font-black">S/ {payments.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            <p className="text-white/40 text-xs mt-1">Ingresos por destacados: S/ {featuredTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 py-8 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users,      label: 'Usuarios',  value: users.total,       sub: `${users.byRole?.VENDOR ?? 0} vendors · ${users.byRole?.CLIENT ?? 0} clientes`, color: 'from-indigo-500 to-purple-600' },
            { icon: Store,      label: 'Negocios',  value: bizStats.total,    sub: 'activos en la plataforma',                                                     color: 'from-blue-500 to-cyan-600' },
            { icon: Calendar,   label: 'Reservas',  value: bookings.total,    sub: `${bookings.byStatus?.COMPLETED ?? 0} completadas`,                              color: 'from-green-500 to-emerald-600' },
            { icon: CreditCard, label: 'Pagos',     value: payments.paid,     sub: `de ${payments.total} registrados`,                                              color: 'from-amber-500 to-orange-600' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${color}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500 font-medium">{label}</p>
                  <Icon className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-3xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Suscripciones */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Suscripciones activas</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { plan: 'FREE',    Icon: Zap,      color: 'bg-gray-50 border-gray-200',     text: 'text-gray-700',   bar: 'bg-gray-400' },
              { plan: 'PRO',     Icon: Crown,    color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', bar: 'bg-indigo-500' },
              { plan: 'PREMIUM', Icon: Sparkles, color: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  bar: 'bg-amber-500' },
            ].map(({ plan, Icon, color, text, bar }) => {
              const count = subscriptions.active[plan] ?? 0;
              const total = Object.values(subscriptions.active).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan} className={`border rounded-2xl p-5 ${color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${text}`} />
                    <span className={`text-xs font-bold ${text}`}>{pct}%</span>
                  </div>
                  <p className={`text-3xl font-black ${text}`}>{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Plan {plan}</p>
                  <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {([
              { key: 'overview',   label: 'Reservas recientes' },
              { key: 'users',      label: `Usuarios (${allUsers.length})` },
              { key: 'businesses', label: `Negocios (${businesses.length})` },
              { key: 'featured',   label: `Destacados (${featuredPayments.length})` },
            ] as { key: Tab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                  tab === t.key ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-800'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Reservas recientes */}
          {tab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Negocio · Servicio</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Monto</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{b.client.name}</p>
                        <p className="text-xs text-gray-400">{b.client.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{b.business.name}</p>
                        <p className="text-xs text-gray-400">{b.service.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(b.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">S/ {Number(b.totalAmount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Todos los usuarios */}
          {tab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Teléfono</th>
                    <th className="px-6 py-4">Registro</th>
                    <th className="px-6 py-4">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{u.phone ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <select
                            value={u.role}
                            disabled={roleLoading === u.id}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className={`appearance-none text-xs font-bold pl-2.5 pr-7 py-1 rounded-full border cursor-pointer focus:outline-none ${
                              u.role === 'ADMIN'  ? 'bg-red-50 border-red-200 text-red-700' :
                              u.role === 'VENDOR' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                                   'bg-gray-100 border-gray-200 text-gray-600'
                            }`}
                          >
                            <option value="CLIENT">CLIENT</option>
                            <option value="VENDOR">VENDOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                          {roleLoading === u.id && <Loader2 className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Todos los negocios */}
          {tab === 'businesses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                    <th className="px-6 py-4">Negocio</th>
                    <th className="px-6 py-4">Owner</th>
                    <th className="px-6 py-4">Stats</th>
                    <th className="px-6 py-4">Destacado</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {businesses.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.category} · {b.city}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 text-xs font-medium">{b.owner.name}</p>
                        <p className="text-gray-400 text-xs">{b.owner.email}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        <span className="mr-3">📅 {b._count.bookings} reservas</span>
                        <span className="mr-3">⭐ {b._count.reviews} reseñas</span>
                        <span>🛠 {b._count.services} servicios</span>
                      </td>
                      <td className="px-6 py-4">
                        {b.featured
                          ? <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">⭐ Destacado</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleBusiness(b.id)}
                          disabled={bizLoading === b.id}
                          className="flex items-center gap-1.5 text-xs font-semibold"
                        >
                          {bizLoading === b.id
                            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            : b.isActive
                              ? <ToggleRight className="w-5 h-5 text-green-500" />
                              : <ToggleLeft className="w-5 h-5 text-gray-400" />
                          }
                          <span className={b.isActive ? 'text-green-600' : 'text-gray-400'}>
                            {b.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagos destacados */}
          {tab === 'featured' && (
            <div>
              <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-amber-800">Total recaudado por destacados</span>
                </div>
                <span className="text-xl font-black text-amber-700">S/ {featuredTotal.toFixed(2)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                      <th className="px-6 py-4">Negocio</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Monto</th>
                      <th className="px-6 py-4">Válido hasta</th>
                      <th className="px-6 py-4">Fecha pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {featuredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{p.business.name}</td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 text-xs font-medium">{p.user.name}</p>
                          <p className="text-gray-400 text-xs">{p.user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{p.days} días</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">S/ {Number(p.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(p.featuredUntil).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {new Date(p.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {featuredPayments.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Aún no hay pagos de destacado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Reservas por estado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Reservas por estado</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className={`rounded-xl px-4 py-3 ${STATUS_COLOR[key]}`}>
                <p className="text-2xl font-black">{bookings.byStatus?.[key] ?? 0}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
