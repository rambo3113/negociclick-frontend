import Link from 'next/link';
import Logo from '@/components/Logo';
import { Home, Calendar, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" light />
        </div>

        {/* 404 number */}
        <div className="relative mb-6 select-none">
          <p className="text-[140px] font-black leading-none tracking-tighter bg-gradient-to-br from-indigo-400/30 to-purple-400/20 bg-clip-text text-transparent">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-7xl drop-shadow-2xl">😵</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">
          Página no encontrada
        </h1>
        <p className="text-white/50 text-sm mb-10 leading-relaxed max-w-xs mx-auto">
          La página que buscas no existe, fue movida o escribiste mal la URL.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-indigo-900/50 hover:-translate-y-0.5 transition-all"
          >
            <Home className="w-4 h-4" /> Ir al inicio
          </Link>
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
          >
            <Calendar className="w-4 h-4" /> Mis reservas
          </Link>
        </div>

        {/* Popular links */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <Search className="w-3.5 h-3.5" /> Quizás buscabas
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: '✂️ Barberías', href: '/?cat=BARBERIA' },
              { label: '🌿 Spas', href: '/?cat=SPA' },
              { label: '🦷 Odontología', href: '/?cat=ODONTOLOGIA' },
              { label: '🏋️ Gimnasios', href: '/?cat=GIMNASIO' },
              { label: '💆 Masajes', href: '/?cat=MASAJES_DOMICILIO' },
            ].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
