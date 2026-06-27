'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { X, CreditCard, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
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

interface BookingSummary {
  id: string;
  service: { name: string };
  business: { name: string };
  date: string;
  totalAmount: number;
}

interface Props {
  booking: BookingSummary;
  paymentId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = 'summary' | 'processing' | 'success';

export default function CulqiPaymentModal({ booking, paymentId, onSuccess, onClose }: Props) {
  const { user } = useAuth();
  const [culqiReady, setCulqiReady] = useState(false);
  const [step, setStep] = useState<Step>('summary');
  const [error, setError] = useState('');
  const paymentIdRef = useRef(paymentId);
  paymentIdRef.current = paymentId;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Culqi) setCulqiReady(true);
  }, []);

  const openCulqi = () => {
    if (!window.Culqi) return;
    setError('');
    window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY!;
    window.Culqi.settings({
      title: 'NegociClick',
      currency: 'PEN',
      description: booking.service.name,
      amount: Math.round(booking.totalAmount * 100),
    });
    window.Culqi.open();
  };

  useEffect(() => {
    window.culqi = async () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        window.Culqi.close();
        setStep('processing');
        setError('');
        try {
          await api.post(`/payments/${paymentIdRef.current}/charge`, {
            token,
            email: user?.email ?? window.Culqi.token.email,
          });
          setStep('success');
        } catch (err: any) {
          setError(err.response?.data?.error || 'El pago fue rechazado. Intenta con otra tarjeta.');
          setStep('summary');
        }
      } else if (window.Culqi.error) {
        setError(window.Culqi.error.user_message || 'Error al procesar el pago');
      }
    };
    return () => { window.culqi = () => {}; };
  }, [user]);

  const amountFormatted = booking.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const dateFormatted = new Date(booking.date).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h3>
              <p className="text-gray-500 text-sm mb-2">
                Tu reserva de <strong>{booking.service.name}</strong> ha sido confirmada.
              </p>
              <p className="text-indigo-600 font-bold text-2xl mb-7">S/ {amountFormatted}</p>
              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Ver mis reservas
              </button>
            </div>

          ) : step === 'processing' ? (
            <div className="p-10 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="font-semibold text-gray-800">Procesando tu pago...</p>
              <p className="text-sm text-gray-400 text-center">No cierres esta ventana</p>
            </div>

          ) : (
            <>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Confirmar pago</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Resumen */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Servicio</span>
                    <span className="font-medium text-gray-900">{booking.service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Negocio</span>
                    <span className="font-medium text-gray-900">{booking.business.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span className="font-medium text-gray-900">{dateFormatted}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-indigo-600 text-lg">S/ {amountFormatted}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3">
                  {['VISA', 'MC', 'AMEX', 'DINERS'].map(brand => (
                    <span key={brand} className="text-xs font-bold text-gray-500 border border-gray-200 rounded px-2 py-1">
                      {brand}
                    </span>
                  ))}
                </div>

                <button
                  onClick={openCulqi}
                  disabled={!culqiReady}
                  className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {!culqiReady ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Cargando...</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Pagar con tarjeta · S/ {amountFormatted}</>
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
