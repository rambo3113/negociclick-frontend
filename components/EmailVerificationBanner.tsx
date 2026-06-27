'use client';

import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import api from '@/lib/api';

export default function EmailVerificationBanner() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleSend = async () => {
    setLoading(true);
    try {
      await api.post('/auth/send-verification');
      setSent(true);
    } catch {
      // silencioso — el botón se puede volver a intentar
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Mail className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        {sent ? (
          <>
            <p className="text-sm font-semibold text-amber-800">¡Correo enviado!</p>
            <p className="text-xs text-amber-600 mt-0.5">Revisa tu bandeja de entrada y haz clic en el enlace de verificación.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-amber-800">Verifica tu correo electrónico</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Verifica tu email para acceder a todas las funciones.{' '}
              <button onClick={handleSend} disabled={loading}
                className="underline font-semibold hover:text-amber-800 disabled:opacity-50 transition">
                {loading ? 'Enviando...' : 'Enviar correo de verificación'}
              </button>
            </p>
          </>
        )}
      </div>
      <button onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 transition flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
