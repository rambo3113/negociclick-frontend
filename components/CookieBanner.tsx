'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const GA_ID = 'G-F2Q5BPY76D';
const STORAGE_KEY = 'nc_cookie_consent';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [gaEnabled, setGaEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted') { setGaEnabled(true); return; }
    if (stored === 'rejected') return;
    setShow(true);
  }, []);

  const accept = () => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, 'accepted');
    setShow(false);
    setGaEnabled(true);
  };

  const reject = () => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, 'rejected');
    setShow(false);
  };

  return (
    <>
      {gaEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {show && (
        <div
          role="dialog"
          aria-label="Aviso de cookies"
          className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-4 py-4 sm:py-5"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-sm text-slate-300 leading-relaxed flex-1">
              Usamos cookies de sesión necesarias y, con tu permiso, Google Analytics para mejorar la plataforma.
              Lee nuestra{' '}
              <Link href="/privacidad" className="underline underline-offset-2 hover:text-white transition">
                Política de Privacidad
              </Link>.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={reject}
                className="text-xs text-slate-400 hover:text-white transition px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500"
              >
                Solo esenciales
              </button>
              <button
                onClick={accept}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition"
              >
                Aceptar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
