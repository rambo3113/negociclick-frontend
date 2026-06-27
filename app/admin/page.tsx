'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Users, Store, Calendar, TrendingUp, CreditCard,
  Crown, Zap, Sparkles, ArrowUpRight, ShieldCheck, Loader2
} from 'lucide-react';

interface Stats {
  users:  { total: number; byRole: Record<string, number> };
  businesses: { total: number };
  bookings: { total: number; byStatus: Record<string, number> };
  payments: { total: number; paid: number; totalRevenue: number; totalVolume: number };
  subscriptions: { active: Record<string, number> };
}

interface RecentBooking {
  id: string;
  date: string;
  status: string;
  totalAmount: number;
  client:   { name: string; email: string };
  business: { name: string };
  service:  { name: string };
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};

type Tab = 'overview' | 'bookings' | 'users';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats]               = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentUsers, setRecentUsers]   = useState<RecentUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<Tab>('overview');

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.role !== 'ADMIN') { router.push('/'); return; }
    if (user?.role === 'ADMIN') {
      api.get('/admin/stats')
        .then(res => {
          setStats(res.data.stats);
          setRecentBookings(res.data.recentBookings);
          setRecentUsers(res.data.recentUsers);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-gray-500 text-sm">Cargando panel...</p>
      </div>
    </div>
  );

  if (!stats) return null;

  const { users, businesses, bookings, payments, subscriptions } = stats;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-semibold uppercase tracking-wider">Admin</span>
            </div>
            <h1 className="text-3xl font-black">Panel de control</h1>
            <p className="text-white/50 text-sm mt-1">Vista general de NegociClick</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs">Ingresos totales NegociClick</p>
            <p className="text-4xl font-black text-white">S/ {payments.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            <p className="text-white/40 text-xs mt-1">Volumen: S/ {payments.totalVolume.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 py-8 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users,      label: 'Usuarios',    value: users.total,      sub: `${users.byRole?.VENDOR ?? 0} vendors · ${users.byRole?.CLIENT ?? 0} clientes`, color: 'from-indigo-500 to-purple-600' },
            { icon: Store,      label: 'Negocios',    value: businesses.total, sub: 'activos en la plataforma',                                                     color: 'from-blue-500 to-cyan-600' },
            { icon: Calendar,   label: 'Reservas',    value: bookings.total,   sub: `${bookings.byStatus?.COMPLETED ?? 0} completadas`,                              color: 'from-green-500 to-emerald-600' },
            { icon: CreditCard, label: 'Pagos',       value: payments.paid,    sub: `de ${payments.total} registrados`,                                              color: 'from-amber-500 to-orange-600' },
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

        {/* Subscriptions breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Suscripciones activas
          </h2>
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
                    <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs: recent data */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'overview', label: 'Reservas recientes' },
              { key: 'users',    label: 'Usuarios recientes' },
            ] as { key: Tab; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-4 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Bookings table */}
          {tab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                    <th className="px-6 py-4 font-semibold">Cliente</th>
                    <th className="px-6 py-4 font-semibold">Negocio · Servicio</th>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Monto</th>
                    <th className="px-6 py-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{b.client.name}</p>
                        <p className="text-xs text-gray-400">{b.client.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{b.business.name}</p>
                        <p className="text-xs text-gray-400">{b.service.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {new Date(b.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        S/ {b.totalAmount.toFixed(2)}
                      </td>
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

          {/* Users table */}
          {tab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                    <th className="px-6 py-4 font-semibold">Usuario</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    <th className="px-6 py-4 font-semibold">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
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
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === 'ADMIN'  ? 'bg-red-100 text-red-700' :
                          u.role === 'VENDOR' ? 'bg-indigo-100 text-indigo-700' :
                                               'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bookings by status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Reservas por estado</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(STATUS_LABEL).map(([key, label]) => {
              const count = bookings.byStatus?.[key] ?? 0;
              return (
                <div key={key} className={`rounded-xl px-4 py-3 ${STATUS_COLOR[key]}`}>
                  <p className="text-2xl font-black">{count}</p>
                  <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
