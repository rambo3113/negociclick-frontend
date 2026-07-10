'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

// Página puente: se llega acá justo después de que next-auth termina el
// intercambio OAuth con Google. La sesión de next-auth (useSession) trae lo
// que el callback jwt/session de lib/auth-next.ts obtuvo del backend
// (nuestro propio token/refreshToken/user, o un pedido de 2FA). Acá se
// vuelca eso al sistema de sesión real de la app (cookies vía useAuth) y se
// cierra la sesión de next-auth, que ya cumplió su única función.
export default function GoogleAuthFinishPage() {
  const { data: session, status } = useSession();
  const { completeLogin } = useAuth();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || handled.current) return;
    handled.current = true;

    const s = session as any;

    if (s.backendError) {
      signOut({ redirect: false }).finally(() => {
        router.replace(`/login?error=${encodeURIComponent(s.backendError)}`);
      });
      return;
    }

    if (s.requiresTwoFactor) {
      sessionStorage.setItem('google2faTempToken', s.tempToken);
      signOut({ redirect: false }).finally(() => {
        router.replace('/login?google2fa=1');
      });
      return;
    }

    if (s.backendToken && s.backendRefreshToken && s.backendUser) {
      completeLogin(s.backendToken, s.backendRefreshToken, s.backendUser);
      signOut({ redirect: false }).finally(() => {
        router.replace(s.backendUser.role === 'VENDOR' ? '/dashboard' : '/');
      });
      return;
    }

    // Sesión de next-auth sin datos del backend — algo salió mal.
    signOut({ redirect: false }).finally(() => {
      router.replace('/login?error=' + encodeURIComponent('No se pudo completar el inicio de sesión con Google'));
    });
  }, [status, session, completeLogin, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-gray-500 text-sm">Completando inicio de sesión con Google...</p>
    </div>
  );
}
