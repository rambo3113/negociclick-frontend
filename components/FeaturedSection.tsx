'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Star, Loader2, Zap } from 'lucide-react';

interface FeaturedStatus {
  featured: boolean;
  featuredUntil: string | null;
  daysLeft: number;
}

interface Pricing {
  [key: string]: { days: number; price: number; label: string };
}

const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? '';

export default function FeaturedSection({ businessId }: { businessId: string }) {
  const { show: showToast } = useToast();
  const [status, setStatus] = useState<FeaturedStatus | null>(null);
  const [pricing, setPricing] = useState<Pricing>({});
  const [selected, setSelected] = useState('15days');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p] = await Promise.allSettled([
          api.get(`/businesses/${businessId}/featured/status`),
          api.get(`/businesses/${businessId}/featured/pricing`),
        ]);
        if (s.status === 'fulfilled') setStatus(s.value.data);
        if (p.status === 'fulfilled') setPricing(p.value.data.pricing ?? p.value.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId]);

  const handlePurchase = async () => {
    const plan = pricing[selected];
    if (!plan) return;
    if (!CULQI_PUBLIC_KEY) {
      showToast('El pago con tarjeta no está disponible ahora mismo. Contacta a soporte.', 'error');
      console.error('[FeaturedSection] Falta NEXT_PUBLIC_CULQI_PUBLIC_KEY — no se puede abrir el checkout.');
      return;
    }

    // Cargar script de Culqi si no está
    if (!window.Culqi) {
      await new Promise<void>(resolve => {
        const s = document.createElement('script');
        s.src = 'https://checkout.culqi.com/js/v4';
        s.onload = () => resolve();
        document.head.appendChild(s);
      });
    }

    window.Culqi.publicKey = CULQI_PUBLIC_KEY;
    window.Culqi.settings({
      title: 'NegociClick',
      currency: 'PEN',
      description: `Negocio Destacado — ${plan.label}`,
      amount: Math.round(plan.price * 100),
    });

    window.culqi = async () => {
      if (window.Culqi.token) {
        setPaying(true);
        try {
          const res = await api.post(`/businesses/${businessId}/featured`, {
            culqiToken: window.Culqi.token.id,
            period: selected,
          });
          showToast(res.data.message, 'success');
          const s = await api.get(`/businesses/${businessId}/featured/status`);
          setStatus(s.data);
        } catch (err: any) {
          showToast(err.response?.data?.error || 'Error al procesar el pago', 'error');
        } finally {
          setPaying(false);
          window.Culqi.close();
        }
      } else if (window.Culqi.error) {
        showToast(window.Culqi.error.user_message || 'Error en el pago', 'error');
      }
    };

    window.Culqi.open();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h3 className="font-bold text-gray-900 text-lg">Negocio Destacado</h3>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Aparece primero en los resultados y con badge dorado. Más visibilidad = más reservas.
      </p>

      {/* Estado actual */}
      {status?.featured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold text-amber-800">¡Tu negocio está Destacado!</p>
            <p className="text-sm text-amber-600">
              {status.daysLeft} día{status.daysLeft !== 1 ? 's' : ''} restante{status.daysLeft !== 1 ? 's' : ''}
              {status.featuredUntil && ` · hasta ${new Date(status.featuredUntil).toLocaleDateString('es-PE')}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">💤</span>
          <p className="text-sm text-gray-500">Tu negocio no está destacado actualmente.</p>
        </div>
      )}

      {/* Selector de plan */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(pricing).map(([key, plan]) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`rounded-xl border-2 p-3 text-center transition-all ${
              selected === key
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300'
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">{plan.label}</p>
            <p className="font-bold text-gray-900">S/ {plan.price.toFixed(2)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              S/ {(plan.price / plan.days).toFixed(2)}/día
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={handlePurchase}
        disabled={paying}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
      >
        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {paying ? 'Procesando...' : `Destacar por ${pricing[selected]?.label} — S/ ${pricing[selected]?.price.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Pago seguro con Culqi · Si ya estás destacado, se extiende el período
      </p>
    </div>
  );
}
