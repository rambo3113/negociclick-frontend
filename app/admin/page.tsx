'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Store, Users, CreditCard, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: { total: number; byRole: Record<string, number> };
  businesses: { total: number; suspended: number };
  payments: { totalRevenue: number; monthCommission: number };
  subscriptions: { active: Record<string, number> };
  reports: { open: number };
}

function StatCard({ icon: Icon, label, value, sub, href, color }: {
  icon: any; label: string; value: string | number; sub?: string; href?: string; color: string;
}) {
  const inner = (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const totalActiveSubs = stats
    ? Object.entries(stats.subscriptions.active)
        .filter(([k]) => k !== 'FREE')
        .reduce((s, [, v]) => s + v, 0)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
        <p className="text-gray-500 text-sm mt-1">Visibilidad global de NegociClick</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Store} label="Negocios activos" value={stats?.businesses.total ?? 0}
          sub={stats?.businesses.suspended ? `${stats.businesses.suspended} suspendidos` : undefined}
          href="/admin/businesses" color="bg-indigo-600/20 text-indigo-400"
        />
        <StatCard
          icon={Users} label="Usuarios registrados" value={stats?.users.total ?? 0}
          sub={`${stats?.users.byRole?.['VENDOR'] ?? 0} vendedores`}
          color="bg-purple-600/20 text-purple-400"
        />
        <StatCard
          icon={CreditCard} label="Suscripciones activas" value={totalActiveSubs}
          sub={`PRO: ${stats?.subscriptions.active?.['PRO'] ?? 0} · PREMIUM: ${stats?.subscriptions.active?.['PREMIUM'] ?? 0}`}
          href="/admin/subscriptions" color="bg-emerald-600/20 text-emerald-400"
        />
        <StatCard
          icon={TrendingUp} label="Comisión este mes"
          value={`S/ ${stats?.payments.monthCommission?.toFixed(2) ?? '0.00'}`}
          sub={`Total histórico: S/ ${stats?.payments.totalRevenue?.toFixed(2) ?? '0.00'}`}
          href="/admin/payments" color="bg-amber-600/20 text-amber-400"
        />
      </div>

      {(stats?.reports.open ?? 0) > 0 && (
        <Link href="/admin/reports">
          <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-5 flex items-center gap-4 mb-6 hover:border-red-700 transition-colors">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-300">
                {stats?.reports.open} reporte{(stats?.reports.open ?? 0) > 1 ? 's' : ''} abierto{(stats?.reports.open ?? 0) > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-500">Requieren revisión</p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/admin/businesses', label: 'Gestionar negocios',      desc: 'Ver, suspender y reactivar' },
          { href: '/admin/payments',   label: 'Ingresos de plataforma',  desc: 'Comisiones y destacados' },
          { href: '/admin/logs',       label: 'Auditoría',               desc: 'Historial de acciones admin' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-colors group"
          >
            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors text-sm">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
