'use client';

import { useEffect, useRef } from 'react';

interface Props {
  onToken: (idToken: string) => void;
  onError?: (msg: string) => void;
}

declare global {
  interface Window { google?: any; }
}

// Renders a "Continuar con Google" button via Google Identity Services.
// Calls onToken with the raw credential (ID token) once the user confirms.
export default function GoogleReauthButton({ onToken, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a stable ref so re-renders don't trigger GIS re-init
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onErrorRef.current?.('GOOGLE_CLIENT_ID no configurado');
      return;
    }

    const init = () => {
      if (!containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res: { credential: string }) => onTokenRef.current(res.credential),
        use_fedcm_for_prompt: false,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        locale: 'es',
        width: 300,
      });
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => onErrorRef.current?.('No se pudo cargar Google. Verifica tu conexión.');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []); // run once

  return <div ref={containerRef} className="flex justify-center" />;
}
