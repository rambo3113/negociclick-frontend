'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Logo from '@/components/Logo';
import { AlertCircle, ArrowLeft, CheckCircle, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.error;
      setError(msg || 'No se pudo procesar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex-col items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="relative z-10 max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" light />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">
            Recupera tu<br />
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              acceso
            </span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Te enviaremos un enlace seguro para restablecer tu contraseña. Válido por 30 minutos.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size="md" /></Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">

            {sent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">¡Correo enviado!</h1>
                <p className="text-gray-500 text-sm mb-6">
                  Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
                <p className="text-xs text-gray-400 mb-6">Revisa también tu carpeta de spam.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-black text-gray-900">¿Olvidaste tu contraseña?</h1>
                  <p className="text-gray-400 text-sm mt-1">Ingresa tu email y te enviamos un enlace de recuperación.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="tu@email.com"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                  <Link href="/login" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
