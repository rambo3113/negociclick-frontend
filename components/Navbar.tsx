'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, Calendar, LayoutDashboard, Menu, X, User, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import api from '@/lib/api';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace('/api', '');
const resolveUrl = (path?: string | null) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    api.get('/auth/pending-count')
      .then(res => setPendingCount(res.data.count ?? 0))
      .catch(() => {});
  }, [user, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setMobileOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled
        ? 'bg-white shadow-lg shadow-gray-200/60 border-b border-gray-200'
        : 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Logo size="sm" />
          </Link>

          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {user ? (
              <>
                {(user.role === 'VENDOR' || user.role === 'ADMIN') && (
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive('/dashboard')
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive('/admin')
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/bookings"
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive('/bookings')
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Mis reservas
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    {user.avatar ? (
                      <img src={resolveUrl(user.avatar)} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-indigo-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all"
                >
                  Registrarse gratis
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {user ? (
            <>
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-gray-100">
                {user.avatar ? (
                  <img src={resolveUrl(user.avatar)} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              {(user.role === 'VENDOR' || user.role === 'ADMIN') && (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <LayoutDashboard className="w-4 h-4 text-gray-400" /> Dashboard
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                  <ShieldCheck className="w-4 h-4" /> Admin
                </Link>
              )}
              <Link href="/bookings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Calendar className="w-4 h-4 text-gray-400" /> Mis reservas
                {pendingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <User className="w-4 h-4 text-gray-400" /> Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full mt-1 border-t border-gray-100 pt-3"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50">
                Iniciar sesión
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-3 py-2.5 rounded-xl text-center">
                Registrarse gratis
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
