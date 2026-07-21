'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Logo from '@/components/Logo';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword]       = useState('');
  const [confirm,  setConfirm]        = useState('');
  const [showPwd,  setShowPwd]        = useState(false);
  const [loading,  setLoading]        = useState(false);
  const [success,  setSuccess]        = useState(false);
  const [error,    setError]          = useState('');

  useEffect(() => {
    if (!token) setError('Enlace inválido. Solicita uno nuevo desde la página de login.');
  }, [token]);

  const pwdChecks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
  };
  const pwdOk = Object.values(pwdChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdOk) return setError('La contraseña no cumple los requisitos.');
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'El enlace no es válido o ya expiró.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">¡Contraseña actualizada!</h1>
          <p className="text-gray-500 text-sm">Serás redirigido al login en unos segundos...</p>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-black text-gray-900">Nueva contraseña</h1>
            <p className="text-gray-400 text-sm mt-1">Elige una contraseña segura para tu cuenta.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="reset-password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {[
                    { ok: pwdChecks.length,    label: 'Mínimo 8 caracteres' },
                    { ok: pwdChecks.uppercase, label: 'Al menos una mayúscula' },
                    { ok: pwdChecks.number,    label: 'Al menos un número' },
                  ].map(({ ok, label }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reset-confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="reset-confirm"
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Repite tu contraseña"
                  className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition-all ${
                    confirm.length > 0
                      ? confirm === password
                        ? 'border-green-300 focus:ring-green-400'
                        : 'border-red-300 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Guardar nueva contraseña'
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex-col items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="relative z-10 max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" light />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">
            Seguridad<br />
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              ante todo
            </span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Elige una contraseña única y segura. No la compartas con nadie.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size="md" /></Link>
          </div>
          <Suspense fallback={<div className="h-64 bg-white rounded-3xl animate-pulse" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
