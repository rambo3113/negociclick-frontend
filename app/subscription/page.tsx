'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Check, X, Zap, Crown, Sparkles, ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';
import CulqiSubscriptionModal from '@/components/CulqiSubscriptionModal';

interface Subscription {
  id: string; plan: string; status: string;
  commissionRate: number; maxServices: number | null;
  price: number; startDate: string;
}

type ProPeriod = 'monthly' | '3months' | '6months';
type PremiumPeriod = 'monthly' | 'annual';

const PRO_PERIODS: { key: ProPeriod; label: string; perMonth: number; save: string | null; total: number; months: number }[] = [
  { key: 'monthly',  label: 'Mensual', perMonth: 29.99, save: null,            total: 29.99,  months: 1 },
  { key: '3months',  label: '3 meses', perMonth: 26.99, save: 'Ahorras S/ 9',  total: 80.97,  months: 3 },
  { key: '6months',  label: '6 meses', perMonth: 23.99, save: 'Ahorras S/ 36', total: 143.94, months: 6 },
];

const PREMIUM_PERIODS: { key: PremiumPeriod; label: string; perMonth: number; save: string | null; total: number; months: number }[] = [
  { key: 'monthly', label: 'Mensual', perMonth: 59.99, save: null,              total: 59.99,  months: 1  },
  { key: 'annual',  label: 'Anual',   perMonth: 47.99, save: 'Ahorras S/ 144', total: 575.88, months: 12 },
];

interface PayingState {
  plan: 'PRO' | 'PREMIUM';
  period: string;
  perMonth: number; totalAmount: number; months: number; periodLabel: string;
}

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState<'PRO' | 'PREMIUM' | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [payingState, setPayingState] = useState<PayingState | null>(null);
  const [proPeriod, setProPeriod] = useState<ProPeriod>('monthly');
  const [premiumPeriod, setPremiumPeriod] = useState<PremiumPeriod>('monthly');

  const currentPlan = subscription?.plan ?? 'FREE';

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.role === 'CLIENT') { router.push('/'); return; }
    if (user) {
      api.get('/subscriptions/my')
        .then(res => {
          setSubscription(res.data.subscription);
          setDaysUntilExpiry(res.data.daysUntilExpiry ?? null);
          setIsTrial(res.data.isTrial ?? false);
          // Si ya usó trial y está en FREE, lo detectamos al intentar activar
        })
        .catch(() => setSubscription(null))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleSubscribe = async (planKey: string) => {
    if (planKey === currentPlan) return;
    setConfirmPlan(null); setSubscribing(planKey); setError(''); setSuccess('');
    try {
      const res = await api.post('/subscriptions', { plan: planKey });
      setSubscription(res.data.subscription);
      setSuccess(`¡Plan ${planKey} activado exitosamente!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar de plan');
    } finally { setSubscribing(null); }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false); setCancelling(true); setError(''); setSuccess('');
    try {
      await api.delete('/subscriptions/cancel');
      setSubscription(null);
      setSuccess('Suscripción cancelada. Volviste al plan FREE.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cancelar suscripción');
    } finally { setCancelling(false); }
  };

  const planOrder = ['FREE', 'PRO', 'PREMIUM'];
  const isDowngrade = (t: string) => planOrder.indexOf(t) < planOrder.indexOf(currentPlan);

  const handleProClick = () => {
    if (currentPlan === 'PRO') return;
    if (isDowngrade('PRO')) { setConfirmPlan('PRO'); return; }
    const p = PRO_PERIODS.find(x => x.key === proPeriod)!;
    setPayingState({ plan: 'PRO', period: p.key, perMonth: p.perMonth, totalAmount: p.total, months: p.months, periodLabel: p.label });
  };

  const handlePremiumClick = () => {
    if (currentPlan === 'PREMIUM') return;
    if (isDowngrade('PREMIUM')) { setConfirmPlan('PREMIUM'); return; }
    const p = PREMIUM_PERIODS.find(x => x.key === premiumPeriod)!;
    setPayingState({ plan: 'PREMIUM', period: p.key, perMonth: p.perMonth, totalAmount: p.total, months: p.months, periodLabel: p.label });
  };

  const handlePaymentSuccess = (sub: any) => {
    setSubscription(sub); setPayingState(null);
    setSuccess(`¡Plan ${sub.plan} activado exitosamente!`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleActivateTrial = async (plan: 'PRO' | 'PREMIUM') => {
    setActivatingTrial(plan); setError(''); setSuccess('');
    try {
      const res = await api.post('/subscriptions/trial', { plan });
      setSubscription(res.data.subscription);
      setIsTrial(true);
      setDaysUntilExpiry(14);
      setSuccess(res.data.message);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al activar el trial';
      if (msg.includes('Ya usaste tu trial')) setTrialUsed(true);
      setError(msg);
    } finally {
      setActivatingTrial(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    </div>
  );

  const proData  = PRO_PERIODS.find(x => x.key === proPeriod)!;
  const premData = PREMIUM_PERIODS.find(x => x.key === premiumPeriod)!;

  /* ─── shared card classes ─── */
  const cardBase = 'relative bg-white rounded-2xl border-2 p-5 flex flex-col';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-3 transition">
            <ChevronLeft className="w-4 h-4" /> Volver al dashboard
          </Link>
          <h1 className="text-2xl font-bold mb-0.5">Elige tu plan</h1>
          <p className="text-indigo-200 text-sm">Más visibilidad, más reservas. Ahorra hasta S/ 192 al año.</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 py-6">

        {/* Banner de vencimiento próximo */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && currentPlan !== 'FREE' && (
          <div className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-3 border text-sm ${
            daysUntilExpiry <= 1
              ? 'bg-red-50 border-red-200 text-red-700'
              : daysUntilExpiry <= 3
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              {daysUntilExpiry <= 0
                ? `Tu plan ${currentPlan} venció hoy — selecciona un plan para renovar.`
                : daysUntilExpiry === 1
                ? `¡Último aviso! Tu plan ${currentPlan} vence mañana. Renueva ahora para no perder tus servicios.`
                : `Tu plan ${currentPlan} vence en ${daysUntilExpiry} días. Renueva el mismo plan para continuar sin interrupciones.`
              }
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /><p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 flex-shrink-0" /><p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* ── Bloque Trial ── solo visible si está en FREE y no tiene trial activo */}
        {currentPlan === 'FREE' && !isTrial && (
          <div className="mb-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="font-bold text-lg">Prueba gratis 14 días</span>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  Activa el trial de <strong>PRO</strong> o <strong>PREMIUM</strong> sin tarjeta. Solo necesitas tener tu negocio y al menos un servicio creado.
                </p>
                <ul className="mt-2 space-y-0.5 text-indigo-100 text-xs">
                  <li>✓ Sin costo, sin tarjeta de crédito</li>
                  <li>✓ Solo 1 trial por cuenta</li>
                  <li>✓ Al vencer, vuelves a FREE automáticamente</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleActivateTrial('PRO')}
                  disabled={activatingTrial !== null}
                  className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-4 py-2 rounded-xl hover:bg-indigo-50 transition text-sm disabled:opacity-60"
                >
                  {activatingTrial === 'PRO' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  Trial PRO gratis
                </button>
                <button
                  onClick={() => handleActivateTrial('PREMIUM')}
                  disabled={activatingTrial !== null}
                  className="flex items-center gap-2 bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-xl hover:bg-yellow-300 transition text-sm disabled:opacity-60"
                >
                  {activatingTrial === 'PREMIUM' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Trial PREMIUM gratis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner trial activo */}
        {isTrial && daysUntilExpiry !== null && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 border bg-indigo-50 border-indigo-200 text-indigo-800 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>
                Trial <strong>{currentPlan}</strong> activo — te quedan <strong>{daysUntilExpiry} días</strong>. Suscríbete abajo para continuar cuando venza.
              </span>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* ── FREE ── */}
          <div className={`${cardBase} ${currentPlan === 'FREE' ? 'border-gray-300 shadow-md ring-2 ring-offset-1 ring-gray-400' : 'border-gray-200 hover:shadow-md'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-gray-600" />
              </div>
              {currentPlan === 'FREE' && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Activo</span>}
            </div>

            <h3 className="text-lg font-bold text-gray-900">Free</h3>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-3xl font-black text-gray-900">S/ 0</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">siempre gratis</p>

            <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-3">
              5 servicios
            </span>

            <ul className="space-y-2 mb-4 flex-1">
              {[
                { label: 'Hasta 5 servicios', ok: true },
                { label: 'Perfil de negocio básico', ok: true },
                { label: 'Reservas de citas', ok: false },
                { label: 'Método de pago', ok: false },
                { label: 'Soporte prioritario', ok: false },
                { label: 'Estadísticas avanzadas', ok: false },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {f.ok ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                </li>
              ))}
            </ul>

            {currentPlan === 'FREE'
              ? <button disabled className="w-full py-2 rounded-xl font-semibold text-sm bg-gray-200 text-gray-500 cursor-default">Plan actual</button>
              : <button onClick={() => setConfirmPlan('FREE')} disabled={!!subscribing} className="w-full py-2 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-900 text-white transition disabled:opacity-60">Cambiar a Free</button>
            }
          </div>

          {/* ── PRO ── */}
          <div className={`${cardBase} ${currentPlan === 'PRO' ? 'border-indigo-400 shadow-md ring-2 ring-offset-1 ring-indigo-500' : 'border-indigo-200 hover:shadow-md'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Crown className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Más popular</span>
                {currentPlan === 'PRO' && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Activo</span>}
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Pro</h3>

            {/* Period tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-3">
              {PRO_PERIODS.map(p => (
                <button key={p.key} onClick={() => setProPeriod(p.key)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${proPeriod === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-0.5">
              {proData.key !== 'monthly' && <span className="text-sm text-gray-300 line-through">S/ 29.99</span>}
              <span className="text-3xl font-black text-gray-900">S/ {proData.perMonth.toFixed(2)}</span>
              <span className="text-gray-400 text-xs">/ mes</span>
            </div>

            {proData.key === 'monthly'
              ? <p className="text-xs text-gray-400 mb-2">Cobro automático cada mes · Cancela cuando quieras</p>
              : <p className="text-xs text-indigo-600 font-semibold mb-2">Total: S/ {proData.total.toFixed(2)} · {proData.months} meses · Cobro automático</p>
            }

            {proData.save
              ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">🎉 {proData.save}</span>
              : <span className="mb-2 block" />
            }

            <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 mb-2">
              Servicios ilimitados
            </span>


            <ul className="space-y-2 mb-4 flex-1">
              {[
                { label: 'Servicios ilimitados', ok: true },
                { label: 'Perfil destacado en búsquedas', ok: true },
                { label: 'Reservas ilimitadas', ok: true },
                { label: 'Soporte prioritario', ok: true },
                { label: 'Estadísticas avanzadas', ok: false },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {f.ok ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                </li>
              ))}
            </ul>

            {currentPlan === 'PRO'
              ? <button disabled className="w-full py-2 rounded-xl font-semibold text-sm bg-indigo-200 text-indigo-600 cursor-default">Plan actual</button>
              : <button onClick={handleProClick} disabled={!!subscribing} className="w-full py-2 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {subscribing === 'PRO' ? <><Loader2 className="w-4 h-4 animate-spin" />Activando...</> : `Activar Pro · S/ ${proData.total.toFixed(2)}`}
                </button>
            }
          </div>

          {/* ── PREMIUM ── */}
          <div className={`${cardBase} ${currentPlan === 'PREMIUM' ? 'border-amber-400 shadow-md ring-2 ring-offset-1 ring-amber-400' : 'border-amber-200 hover:shadow-md'}`}>
            <div className="flex justify-between items-center mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Mejor valor</span>
                {currentPlan === 'PREMIUM' && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Activo</span>}
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Premium</h3>

            {/* Period tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-3 relative">
              {PREMIUM_PERIODS.map(p => (
                <button key={p.key} onClick={() => setPremiumPeriod(p.key)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all relative ${premiumPeriod === p.key ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {p.key === 'annual' && (
                    <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${premiumPeriod === 'annual' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                      20% off
                    </span>
                  )}
                  {p.label}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mb-0.5">
              {premData.key !== 'monthly' && <span className="text-sm text-gray-300 line-through">S/ 59.99</span>}
              <span className="text-3xl font-black text-gray-900">S/ {premData.perMonth.toFixed(2)}</span>
              <span className="text-gray-400 text-xs">/ mes</span>
            </div>

            {premData.key === 'monthly'
              ? <p className="text-xs text-gray-400 mb-2">por mes, sin compromiso</p>
              : <p className="text-xs text-amber-600 font-semibold mb-2">Total: S/ {premData.total.toFixed(2)} · {premData.months} meses</p>
            }

            {premData.save
              ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">🎉 {premData.save}</span>
              : <span className="mb-2 block" />
            }

            <span className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 mb-2">
              Servicios ilimitados
            </span>


            <ul className="space-y-2 mb-4 flex-1">
              {[
                { label: 'Servicios ilimitados', ok: true },
                { label: 'Posición top en búsquedas', ok: true },
                { label: 'Reservas ilimitadas', ok: true },
                { label: 'Soporte 24/7', ok: true },
                { label: 'Estadísticas avanzadas', ok: true },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {f.ok ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <X className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
                </li>
              ))}
            </ul>

            {currentPlan === 'PREMIUM'
              ? <button disabled className="w-full py-2 rounded-xl font-semibold text-sm bg-amber-200 text-amber-700 cursor-default">Plan actual</button>
              : <button onClick={handlePremiumClick} disabled={!!subscribing} className="w-full py-2 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {subscribing === 'PREMIUM' ? <><Loader2 className="w-4 h-4 animate-spin" />Activando...</> : `Activar Premium · S/ ${premData.total.toFixed(2)}`}
                </button>
            }
          </div>
        </div>

        {/* Cancel subscription */}
        {currentPlan !== 'FREE' && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <p className="font-semibold text-red-900 text-sm">Cancelar suscripción</p>
              <p className="text-red-700 text-xs">Volverás al plan FREE y tu comisión aumentará al 15%.</p>
            </div>
            <button onClick={() => setShowCancelConfirm(true)} disabled={cancelling}
              className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 px-3 py-1.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
              {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
              {cancelling ? 'Cancelando...' : 'Cancelar plan'}
            </button>
          </div>
        )}

        {subscription && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Detalles de tu suscripción</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { label: 'Plan', value: subscription.plan },
                { label: 'Estado', value: subscription.status },
                { label: 'Comisión', value: `${(subscription.commissionRate * 100).toFixed(0)}%` },
                { label: 'Desde', value: new Date(subscription.startDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Culqi modal */}
      {payingState && (
        <CulqiSubscriptionModal
          plan={payingState.plan}
          period={payingState.period}
          perMonth={payingState.perMonth}
          totalAmount={payingState.totalAmount}
          months={payingState.months}
          periodLabel={payingState.periodLabel}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPayingState(null)}
        />
      )}

      {/* Confirm downgrade */}
      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmPlan(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900">¿Cambiar a un plan inferior?</h3>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Vas a bajar de <strong>{currentPlan}</strong> a <strong>{confirmPlan}</strong>. Tu comisión aumentará y tendrás menos servicios disponibles.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPlan(null)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={() => handleSubscribe(confirmPlan)} className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-900 transition">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm cancel */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Cancelar suscripción</h3>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              Volverás al plan <strong>FREE</strong> con una comisión del <strong>15%</strong> por reserva. ¿Estás seguro?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Mantener plan</button>
              <button onClick={handleCancel} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition">Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
