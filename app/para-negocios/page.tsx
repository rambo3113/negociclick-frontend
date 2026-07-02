import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Check, Zap, Crown, Sparkles, Calendar, BarChart2, Star, Shield, Clock, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Para Negocios — Publica y crece en Lima',
  description: 'Lleva tu negocio al siguiente nivel con NegociClick. Reservas 24/7, panel de gestión y 14 días de PRO gratis sin tarjeta.',
};

const BENEFITS = [
  { icon: Calendar, title: 'Reservas 24/7', desc: 'Tus clientes reservan mientras duermes. Sin llamadas, sin WhatsApp a medianoche.', color: 'bg-indigo-100 text-indigo-600' },
  { icon: BarChart2, title: 'Panel de control', desc: 'Ve tus reservas, ingresos, analíticas y agenda del día en un solo lugar.', color: 'bg-purple-100 text-purple-600' },
  { icon: Users, title: 'Más visibilidad', desc: 'Aparece en búsquedas de Lima por categoría. Nuevos clientes te encuentran sin publicidad.', color: 'bg-pink-100 text-pink-600' },
  { icon: Shield, title: 'Sin comisiones', desc: 'El 100% de cada reserva es tuyo. Cobramos por el plan, nunca por transacción.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Star, title: 'Reseñas verificadas', desc: 'Solo clientes reales pueden dejar reseñas. Construye reputación con confianza.', color: 'bg-yellow-100 text-yellow-600' },
  { icon: Clock, title: 'Configuración en 3 min', desc: 'Crea tu perfil, agrega tus servicios y empieza a recibir citas hoy mismo.', color: 'bg-cyan-100 text-cyan-600' },
];

const STEPS = [
  { n: '1', title: 'Crea tu perfil', desc: 'Registra tu negocio con foto, dirección, descripción y horarios de atención.' },
  { n: '2', title: 'Agrega tus servicios', desc: 'Define cada servicio con nombre, precio y duración. Sin límite en PRO y PREMIUM.' },
  { n: '3', title: 'Recibe reservas', desc: 'Tus clientes reservan online. Tú confirmas, gestionas y cobras desde tu panel.' },
];

const PLANS = [
  {
    key: 'FREE',
    name: 'Free',
    icon: Zap,
    price: 'S/ 0',
    period: 'siempre gratis',
    color: 'border-gray-200',
    iconBg: 'bg-gray-100 text-gray-600',
    features: ['1 negocio', 'Hasta 5 servicios', 'Reservas básicas', 'Perfil público'],
    cta: { label: 'Empezar gratis', href: '/register?role=VENDOR', style: 'bg-gray-900 text-white hover:bg-gray-700' },
    trial: false,
  },
  {
    key: 'PRO',
    name: 'Pro',
    icon: Crown,
    price: 'S/ 29.99',
    period: '/mes',
    color: 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2',
    iconBg: 'bg-indigo-100 text-indigo-600',
    badge: '⭐ Más popular',
    features: ['Todo lo de Free', 'Hasta 15 servicios', 'Agenda diaria', 'Analíticas avanzadas', 'Marcar pagado en efectivo', 'Soporte prioritario'],
    cta: { label: 'Probar PRO 14 días gratis', href: '/register?role=VENDOR', style: 'bg-indigo-600 text-white hover:bg-indigo-700' },
    trial: true,
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    icon: Sparkles,
    price: 'S/ 79.99',
    period: '/mes',
    color: 'border-purple-400',
    iconBg: 'bg-purple-100 text-purple-600',
    features: ['Todo lo de Pro', 'Servicios ilimitados', 'Cobro online con Culqi', 'Negocio destacado', 'Múltiples servicios por reserva'],
    cta: { label: 'Probar PREMIUM 14 días gratis', href: '/register?role=VENDOR', style: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90' },
    trial: true,
  },
];

const FAQ = [
  { q: '¿Necesito tarjeta para el trial?', a: 'No. El trial de 14 días es completamente gratuito, sin tarjeta ni compromiso. Al vencer, vuelves a FREE automáticamente.' },
  { q: '¿Puedo usar el trial solo una vez?', a: 'Sí, el trial es por cuenta. Pero puedes probarlo en PRO o en PREMIUM — tú eliges cuál quieres explorar.' },
  { q: '¿Qué pasa con mis reservas si bajo a FREE?', a: 'Tus reservas existentes se mantienen. Solo pierdes acceso a funciones avanzadas como el cobro online y servicios ilimitados.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin contratos ni permanencia. Cancelas desde tu dashboard en cualquier momento.' },
];

export default function ParaNegociosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-0 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-4 py-2 rounded-full mb-6">
            ✨ 14 días de PRO o PREMIUM gratis — sin tarjeta
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
            Haz crecer tu negocio<br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              en Lima con NegociClick
            </span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Reservas online 24/7, panel de gestión, analíticas y más visibilidad para tu negocio. Empieza gratis hoy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?role=VENDOR"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:shadow-indigo-900/40 hover:-translate-y-0.5 transition-all text-sm"
            >
              Crear mi negocio gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#planes" className="text-white/50 hover:text-white transition text-sm font-medium flex items-center gap-1.5">
              Ver planes <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-10 sm:gap-16 mt-14 border-t border-white/10 pt-10">
            {[
              { value: 'S/ 0', label: 'para empezar' },
              { value: '14 días', label: 'de PRO gratis' },
              { value: '24/7', label: 'reservas online' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Todo lo que necesitas para crecer</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Herramientas profesionales para negocios de cualquier tamaño en Lima.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${b.color}`}>
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Configura en 3 minutos</h2>
            <p className="text-gray-400 text-sm">Sin técnicos, sin complicaciones. Tú solo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
                  {s.n}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute mt-7 ml-48 w-20 border-t-2 border-dashed border-indigo-200" />
                )}
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planes ── */}
      <section id="planes" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Elige tu plan</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">Empieza gratis. Crece cuando quieras. Sin contratos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.key} className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${plan.color}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.iconBg}`}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                {plan.trial && (
                  <p className="text-xs text-indigo-600 font-semibold mb-4">✨ 14 días gratis — sin tarjeta</p>
                )}
                {!plan.trial && <p className="text-xs text-gray-400 mb-4">siempre gratis</p>}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.cta.href}
                  className={`w-full text-center font-bold px-4 py-3 rounded-xl transition text-sm ${plan.cta.style}`}
                >
                  {plan.cta.label}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-xs mt-6">
            ¿Ya tienes cuenta? <Link href="/subscription" className="text-indigo-600 hover:underline font-medium">Activa tu trial desde tu dashboard →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="border border-gray-100 rounded-2xl p-5">
                <p className="font-bold text-gray-900 mb-2">{item.q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 py-20">
        <div className="absolute -top-32 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Empieza hoy — es gratis
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Crea tu perfil en 3 minutos y activa tu trial de 14 días de PRO o PREMIUM sin tarjeta de crédito.
          </p>
          <Link
            href="/register?role=VENDOR"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:shadow-indigo-900/40 hover:-translate-y-0.5 transition-all text-sm"
          >
            Crear mi negocio gratis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
