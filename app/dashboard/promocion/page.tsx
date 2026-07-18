'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';


const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CULQI_PK = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? '';

interface Business {
  id: string;
  name: string;
  featured: boolean;
  featuredUntil?: string | null;
}

const PLANS = [
  { period: '7days',  days: 7,  price: 9.90,  perDay: 1.41, label: '7 días',  popular: false },
  { period: '15days', days: 15, price: 19.90, perDay: 1.33, label: '15 días', popular: true  },
  { period: '30days', days: 30, price: 29.90, perDay: 1.00, label: '30 días', popular: false },
];

function daysLeft(until: string) {
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86_400_000));
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function PromocionPage() {
  const [business, setBusiness]     = useState<Business | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<string | null>(null);
  const [step, setStep]             = useState<'idle' | 'processing' | 'success' | 'cancel-confirm'>('idle');
  const [error, setError]           = useState('');
  const [extended, setExtended]     = useState(false);
  const [newUntil, setNewUntil]     = useState('');
  const selectedRef                 = useRef<string | null>(null);
  const businessRef                 = useRef<Business | null>(null);

  selectedRef.current  = selected;
  businessRef.current  = business;

  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('token');
    fetch(`${API}/businesses/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const list: Business[] = d.businesses ?? [];
        setBusiness(list[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Culqi callback
  useEffect(() => {
    window.culqi = async () => {
      if (!window.Culqi.token) {
        if (window.Culqi.error) setError(window.Culqi.error.user_message);
        return;
      }
      const culqiToken = window.Culqi.token.id;
      window.Culqi.close();
      setStep('processing');
      setError('');
      try {
        const token    = typeof window !== 'undefined' && localStorage.getItem('token');
        const biz      = businessRef.current!;
        const period   = selectedRef.current!;
        const res = await fetch(`${API}/businesses/${biz.id}/featured`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ culqiToken, period }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Error al procesar pago'); setStep('idle'); return; }
        setExtended(data.extended ?? false);
        setNewUntil(data.featuredUntil ?? '');
        setStep('success');
        // Refresh business status
        setBusiness(prev => prev ? { ...prev, featured: true, featuredUntil: data.featuredUntil } : prev);
      } catch {
        setError('Error de red. Intenta de nuevo.');
        setStep('idle');
      }
    };
  }, []);

  function openCulqi(plan: typeof PLANS[0]) {
    if (!window.Culqi) { setError('El checkout aún no cargó, intenta en un momento.'); return; }
    if (!CULQI_PK) { setError('Pago no disponible. Contacta soporte.'); return; }
    setSelected(plan.period);
    setError('');
    window.Culqi.publicKey = CULQI_PK;
    window.Culqi.settings({
      title:       'NegociClick',
      currency:    'PEN',
      description: `Negocio Destacado — ${plan.label}`,
      amount:      Math.round(plan.price * 100),
    });
    window.Culqi.open();
  }

  async function confirmCancel() {
    setStep('processing');
    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('token');
      const biz   = businessRef.current!;
      const res = await fetch(`${API}/businesses/${biz.id}/featured`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al cancelar'); setStep('idle'); return; }
      setBusiness(prev => prev ? { ...prev, featured: false, featuredUntil: null } : prev);
      setStep('idle');
    } catch {
      setError('Error de red.');
      setStep('idle');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No tienes un negocio registrado.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">Ir al dashboard →</Link>
        </div>
      </div>
    );
  }

  const left = business.featuredUntil ? daysLeft(business.featuredUntil) : 0;
  const isActive = business.featured && left > 0;
  const urgency  = left > 0 && left <= 3;

  return (
    <>
      <Script src="https://checkout.culqi.com/js/v4" strategy="afterInteractive" onLoad={() => {}} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Volver al dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">Promocionar mi negocio</h1>
            <p className="text-gray-500 text-sm mt-1">{business.name}</p>
          </div>

          {/* Success state */}
          {step === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
              <div className="text-4xl mb-3">{extended ? '✅' : '⭐'}</div>
              <h2 className="text-lg font-bold text-green-800 mb-1">
                {extended ? '¡Destacado extendido!' : '¡Ahora estás destacado!'}
              </h2>
              <p className="text-green-700 text-sm">
                {extended
                  ? `Tu destacado fue extendido. Nueva fecha de vencimiento:`
                  : 'Tu negocio aparecerá primero en los resultados con un badge dorado. Período hasta:'}
              </p>
              {newUntil && (
                <p className="font-bold text-green-900 mt-1">{fmtDate(newUntil)}</p>
              )}
              <button onClick={() => setStep('idle')} className="mt-4 text-sm text-green-700 underline">Ver estado</button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
              {error}
            </div>
          )}

          {/* Processing overlay */}
          {step === 'processing' && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-700 font-medium">Procesando pago...</p>
              </div>
            </div>
          )}

          {/* Cancel confirm dialog */}
          {step === 'cancel-confirm' && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
                <h3 className="font-bold text-gray-900 mb-2">¿Cancelar destacado?</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Tu negocio dejará de aparecer primero en los resultados. No hay reembolso por el período restante.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('idle')}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    No, mantener
                  </button>
                  <button
                    onClick={confirmCancel}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                  >
                    Sí, cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active status card */}
          {isActive && step !== 'success' && (
            <div className={`rounded-2xl border p-6 mb-8 ${urgency ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">⭐</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${urgency ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {urgency ? '⚠ Vence pronto' : '✓ Activo'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    Tu negocio está Destacado
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Destacado hasta el <strong>{fmtDate(business.featuredUntil!)}</strong>
                  </p>
                  <p className={`text-sm font-bold mt-1 ${urgency ? 'text-red-700' : 'text-indigo-700'}`}>
                    {left} {left === 1 ? 'día restante' : 'días restantes'}
                  </p>
                </div>
                <button
                  onClick={() => setStep('cancel-confirm')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 shrink-0"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Headline */}
          <div className="text-center mb-6">
            {isActive ? (
              <>
                <h2 className="text-xl font-bold text-gray-900">Extender destacado</h2>
                <p className="text-gray-500 text-sm mt-1">Suma más días a tu período actual — la fecha se extiende, no reinicia.</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">⭐</div>
                <h2 className="text-xl font-bold text-gray-900">Negocio Destacado</h2>
                <p className="text-gray-500 text-sm mt-1">Aparece primero en los resultados y con un badge dorado.</p>
                <div className="flex items-center justify-center gap-4 mt-4 flex-wrap text-sm text-gray-600">
                  <span>✅ Badge dorado en resultados</span>
                  <span>✅ Posición #1</span>
                  <span>✅ Más visibilidad = más reservas</span>
                </div>
              </>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {PLANS.map(plan => (
              <div
                key={plan.period}
                className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  plan.popular
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
                onClick={() => step === 'idle' && openCulqi(plan)}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full">
                    MÁS POPULAR
                  </span>
                )}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{plan.label}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  S/ {plan.price.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">S/ {plan.perDay.toFixed(2)} /día</p>
                <button
                  disabled={step !== 'idle'}
                  className={`w-full mt-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      : 'bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50'
                  }`}
                >
                  {isActive ? `Extender ${plan.label}` : `Destacar ${plan.label}`}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            Pago seguro con <strong>Culqi</strong>. No se guardan datos de tarjeta. Sin suscripción automática.
          </p>
        </div>
      </div>
    </>
  );
}
