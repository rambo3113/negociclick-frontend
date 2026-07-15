'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard, Store, CreditCard, FileText, ScrollText,
  LogOut, ShieldCheck, ChevronRight, Loader2, Gift,
} from 'lucide-react';

const NAV = [
  { href: '/admin',               label: 'Resumen',       icon: LayoutDashboard },
  { href: '/admin/businesses',    label: 'Negocios',      icon: Store },
  { href: '/admin/subscriptions', label: 'Suscripciones', icon: CreditCard },
  { href: '/admin/payments',      label: 'Pagos',         icon: CreditCard },
  { href: '/admin/reports',       label: 'Reportes',      icon: FileText },
  { href: '/admin/trials',        label: 'Trials',        icon: Gift },
  { href: '/admin/logs',          label: 'Auditoría',     icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user === undefined) return; // aún cargando
    if (!user || (user as any).role !== 'ADMIN') {
      router.replace('/dashboard');
    } else {
      setChecking(false);
    }
  }, [user, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">NegociClick</p>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-2 w-full text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
