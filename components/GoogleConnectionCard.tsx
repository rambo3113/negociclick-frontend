'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Link2, Unlink } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import GoogleIcon from '@/components/GoogleIcon';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function GoogleConnectionCard() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [unlinking, setUnlinking] = useState(false);

  const isConnected = !!user?.googleId;

  const handleConnect = () => {
    signIn('google', { callbackUrl: '/auth/google/finish' });
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await api.post('/auth/unlink-google');
      await refreshProfile();
      toast.show('Cuenta de Google desvinculada', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'No se pudo desvincular Google', 'error');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <GoogleIcon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Cuenta de Google</p>
            {isConnected ? (
              <p className="text-xs text-gray-500 truncate">Conectado con {user?.googleEmail || user?.email}</p>
            ) : (
              <p className="text-xs text-gray-400">No conectado</p>
            )}
          </div>
        </div>

        {isConnected ? (
          <button
            onClick={handleUnlink}
            disabled={unlinking || !user?.hasPassword}
            title={!user?.hasPassword ? 'Configura una contraseña antes de desvincular Google' : undefined}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Unlink className="w-3.5 h-3.5" />
            {unlinking ? 'Desvinculando...' : 'Desconectar'}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Link2 className="w-3.5 h-3.5" />
            Conectar
          </button>
        )}
      </div>

      {isConnected && !user?.hasPassword && (
        <p className="text-xs text-amber-600 mt-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Tu cuenta solo tiene acceso vía Google. Configura una contraseña de respaldo para poder desvincularla.
        </p>
      )}
    </div>
  );
}
