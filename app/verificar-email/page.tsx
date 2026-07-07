'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get('token');
  const { refreshProfile } = useAuth();
  const [status,    setStatus]    = useState<'loading' | 'ok' | 'error'>('loading');
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('ok');
        // Refresca el user en memoria: sin esto, el dashboard seguía mostrando
        // el aviso de "verifica tu correo" con los datos viejos hasta el próximo login.
        refreshProfile();
      })
      .catch(() => setStatus('error'));
  }, [token, refreshProfile]);

  // Countdown + redirect automático al verificar
  useEffect(() => {
    if (status !== 'ok') return;
    if (countdown <= 0) { router.push('/dashboard'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30 flex items-center justify-center px-4">

      {/* Blobs decorativos */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-10 max-w-md w-full text-center">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo /></Link>
        </div>

        {/* ── Cargando ── */}
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 mb-1">Verificando tu correo</h1>
              <p className="text-gray-400 text-sm">Un momento, estamos activando tu cuenta…</p>
            </div>
          </div>
        )}

        {/* ── Éxito ── */}
        {status === 'ok' && (
          <div className="space-y-5">
            {/* Ícono animado */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">¡Correo verificado!</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Tu cuenta está completamente activa. Ya puedes usar todas las funciones de NegociClick.
              </p>
            </div>

            {/* Barra de progreso del countdown */}
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((4 - countdown) / 4) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                Redirigiendo al dashboard en <span className="font-semibold text-gray-600">{countdown}s</span>…
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-200 text-sm"
            >
              Ir al dashboard ahora <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
              <XCircle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Enlace inválido</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                El enlace expiró o ya fue utilizado. Los enlaces de verificación son válidos por 24 horas.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left">
              <p className="text-xs font-semibold text-amber-800 mb-1">¿Qué puedes hacer?</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Inicia sesión y solicita un nuevo enlace desde el dashboard.</li>
                <li>• Revisa tu carpeta de spam si aún no llega.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-200 text-sm"
              >
                Ir al dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/login"
                className="w-full block text-center py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
