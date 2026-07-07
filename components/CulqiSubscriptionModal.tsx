'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { X, CreditCard, CheckCircle, Loader2, ShieldCheck, Crown, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

declare global {
  interface Window {
    Culqi: {
      publicKey: string;
      settings: (opts: { title: string; currency: string; description: string; amount: number }) => void;
      open: () => void;
      close: () => void;
      token?: { id: string; email: string };
      error?: { user_message: string; merchant_message?: string };
    };
    culqi: () => void;
  }
}

interface Props {
  plan: 'PRO' | 'PREMIUM';
  period: string;
  perMonth: number;
  totalAmount: number;
  months: number;
  periodLabel: string;
  onSuccess: (subscription: any) => void;
  onClose: () => void;
}

const PLAN_META = {
  PRO: {
    name: 'Pro',
    Icon: Crown,
    gradient: 'from-indigo-600 to-indigo-500',
    btnClass: 'bg-indigo-600 hover:bg-indigo-700',
    amountColor: 'text-indigo-600',
    benefits: [
      'Servicios ilimitados',
      'Perfil destacado en búsquedas',
      'Soporte prioritario',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    Icon: Sparkles,
    gradient: 'from-amber-500 to-yellow-500',
    btnClass: 'bg-amber-500 hover:bg-amber-600',
    amountColor: 'text-amber-600',
    benefits: [
      'Servicios ilimitados',
      'Posición top en búsquedas',
      'Soporte 24/7',
      'Estadísticas avanzadas',
    ],
  },
};

export default function CulqiSubscriptionModal({ plan, period, perMonth, totalAmount, months, periodLabel, onSuccess, onClose }: Props) {
  const { user } = useAuth();
  const [culqiReady, setCulqiReady] = useState(false);
  const [step, setStep] = useState<'summary' | 'processing' | 'success'>('summary');
  const [error, setError] = useState('');
  const planRef = useRef(plan);
  planRef.current = plan;
  const periodRef = useRef(period);
  periodRef.current = period;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Culqi) {
      setCulqiReady(true);
    }
  }, []);

  const meta = PLAN_META[plan];
  const { Icon } = meta;

  const openCulqi = () => {
    if (!window.Culqi) return;
    setError('');
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
    window.Culqi.settings({
      title: 'NegociClick',
      currency: 'PEN',
      description: `Plan ${meta.name} - ${periodLabel}`,
      amount: Math.round(totalAmount * 100),
    });
    window.Culqi.open();
  };

  useEffect(() => {
    window.culqi = async () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        const email = user?.email ?? window.Culqi.token.email;
        window.Culqi.close();
        setStep('processing');
        setError('');
        try {
          const res = await api.post('/subscriptions/pay', {
            plan: planRef.current,
            period: periodRef.current,
            token,
            email,
          });
          setStep('success');
          setTimeout(() => onSuccess(res.data.subscription), 2000);
        } catch (err: any) {
          setError(err.response?.data?.error || 'El pago fue rechazado. Intenta con otra tarjeta.');
          setStep('summary');
        }
      } else if (window.Culqi?.error) {
        setError(window.Culqi.error.user_message || 'Error al procesar el pago');
      }
    };

    return () => { window.culqi = () => {}; };
  }, [user, onSuccess]);

  return (
    <>
      <Script
        src="https://checkout.culqi.com/js/v4"
        strategy="afterInteractive"
        onLoad={() => setCulqiReady(true)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={step === 'processing' ? undefined : onClose}
        />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">

          {step === 'success' ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-11 h-11 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Plan activado!</h3>
              <p className="text-gray-500 text-sm mb-3">
                Bienvenido al plan <strong>{meta.name}</strong>.
                Ahora tienes mayor visibilidad y menor comisión.
              </p>
              <p className={`font-bold text-2xl ${meta.amountColor}`}>
                S/ {perMonth.toLocaleString('es-PE', { minimumFractionDigits: 2 })} / mes
              </p>
              {months > 1 && (
                <p className="text-gray-400 text-sm mt-1">
                  Total cobrado: S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })} · {periodLabel}
                </p>
              )}
            </div>

          ) : step === 'processing' ? (
            <div className="p-10 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="font-semibold text-gray-800">Procesando tu pago...</p>
              <p className="text-sm text-gray-400 text-center">No cierres esta ventana</p>
            </div>

          ) : (
            <>
              {/* Header with gradient */}
              <div className={`px-6 pt-6 pb-5 bg-gradient-to-r ${meta.gradient} text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs">Activar plan</p>
                      <h3 className="text-xl font-bold">{meta.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">
                    S/ {perMonth.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-white/70 text-sm">/ mes</span>
                </div>
                {months > 1 && (
                  <p className="text-white/70 text-xs mt-1">
                    Total a cobrar: S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })} · {periodLabel}
                  </p>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Benefits */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lo que obtienes</p>
                  {meta.benefits.map(b => (
                    <div key={b} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{b}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                {/* Accepted cards */}
                <div className="flex items-center justify-center gap-3">
                  {['VISA', 'MC', 'AMEX', 'DINERS'].map(brand => (
                    <span
                      key={brand}
                      className="text-xs font-bold text-gray-500 border border-gray-200 rounded px-2 py-1"
                    >
                      {brand}
                    </span>
                  ))}
                </div>

                <button
                  onClick={openCulqi}
                  disabled={!culqiReady}
                  className={`w-full text-white py-3.5 rounded-xl font-bold text-base transition disabled:opacity-60 flex items-center justify-center gap-2 ${meta.btnClass}`}
                >
                  {!culqiReady ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Cargando...</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Pagar con tarjeta</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Pago 100% seguro · Powered by Culqi
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
