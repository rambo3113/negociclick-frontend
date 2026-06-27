'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import {
  Eye, EyeOff, AlertCircle, ArrowRight,
  User, Store, Mail, Phone, Lock, Check,
  Sparkles, ShieldCheck, Clock, Star, TrendingUp, Calendar,
} from 'lucide-react';

const ROLE_CONFIG = {
  CLIENT: {
    gradient: 'from-slate-900 via-indigo-950 to-violet-950',
    blob1: 'bg-indigo-600/20',
    blob2: 'bg-violet-600/20',
    accent: 'from-indigo-300 to-violet-300',
    headline: 'Reserva cualquier servicio',
    sub: 'en Lima',
    desc: 'Encuentra, compara y agenda con los mejores profesionales. Sin llamadas, sin esperas.',
    features: [
      { Icon: Star,      text: 'Reseñas reales de otros clientes' },
      { Icon: Clock,     text: 'Agenda en menos de 60 segundos' },
      { Icon: ShieldCheck, text: 'Pagos 100% seguros con Culqi' },
      { Icon: Calendar,  text: 'Recordatorios automáticos de tu cita' },
    ],
    stats: [
      { value: '27+',  label: 'Categorías' },
      { value: '4.8★', label: 'Rating promedio' },
      { value: '100%', label: 'Pago seguro' },
    ],
    btnLabel: 'Crear mi cuenta gratis',
    btnColor: 'from-indigo-600 to-violet-600',
    roleLabel: 'Soy cliente',
    roleSub: 'Quiero reservar servicios',
    checkColor: 'text-indigo-600',
    ringColor: 'ring-indigo-500',
    bgSelected: 'bg-indigo-50 border-indigo-500',
  },
  VENDOR: {
    gradient: 'from-slate-900 via-emerald-950 to-teal-950',
    blob1: 'bg-emerald-600/20',
    blob2: 'bg-teal-600/20',
    accent: 'from-emerald-300 to-teal-300',
    headline: 'Haz crecer tu negocio',
    sub: 'con NegociClick',
    desc: 'Publica tus servicios, recibe reservas online y gestiona todo desde un solo lugar.',
    features: [
      { Icon: TrendingUp,  text: 'Más visibilidad en Lima y Peru' },
      { Icon: Calendar,    text: 'Reservas online las 24 horas' },
      { Icon: Sparkles,    text: 'Plan gratuito para siempre' },
      { Icon: ShieldCheck, text: 'Cobros seguros y sin comisiones' },
    ],
    stats: [
      { value: 'S/0',   label: 'Para empezar' },
      { value: '3 min', label: 'Para publicar' },
      { value: '0%',    label: 'Comisión' },
    ],
    btnLabel: 'Publicar mi negocio gratis',
    btnColor: 'from-emerald-600 to-teal-600',
    roleLabel: 'Tengo un negocio',
    roleSub: 'Quiero recibir reservas',
    checkColor: 'text-emerald-600',
    ringColor: 'ring-emerald-500',
    bgSelected: 'bg-emerald-50 border-emerald-500',
  },
} as const;

type Role = 'CLIENT' | 'VENDOR';

function RegisterPageContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<{ name: string; email: string; password: string; phone: string; role: Role }>({
    name: '', email: '', password: '', phone: '', role: 'CLIENT',
  });

  // Pre-seleccionar rol si viene del link del login (?role=VENDOR)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'VENDOR' || roleParam === 'CLIENT') {
      setForm(f => ({ ...f, role: roleParam }));
    }
  }, [searchParams]);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, phone: false, password: false });

  const cfg = ROLE_CONFIG[form.role];

  const pwdRules = [
    { ok: form.password.length >= 8,   label: '8+ caracteres' },
    { ok: /[A-Z]/.test(form.password), label: 'Una mayúscula' },
    { ok: /[0-9]/.test(form.password), label: 'Un número' },
  ];
  const pwdScore = pwdRules.filter(r => r.ok).length;
  const passwordValid = pwdScore === 3;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, phone: true, password: true });

    if (!passwordValid) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
      return;
    }
    if (form.phone && form.phone.length !== 9) {
      setError('El teléfono debe tener exactamente 9 dígitos.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      router.push(form.role === 'VENDOR' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const setRole = (role: Role) => setForm(f => ({ ...f, role }));

  const pwdBarColor =
    pwdScore === 0 ? 'bg-gray-200' :
    pwdScore === 1 ? 'bg-red-400' :
    pwdScore === 2 ? 'bg-amber-400' :
    'bg-green-500';

  return (
    <div className="min-h-screen flex">
      {/* ── Panel izquierdo — dinámico por rol ── */}
      <div
        className={`hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br ${cfg.gradient} flex-col items-center justify-center p-12 transition-all duration-500`}
      >
        {/* Blobs decorativos */}
        <div className={`absolute top-0 right-0 w-[480px] h-[480px] ${cfg.blob1} rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none transition-colors duration-500`} />
        <div className={`absolute bottom-0 left-0 w-[380px] h-[380px] ${cfg.blob2} rounded-full blur-3xl -translate-x-1/4 translate-y-1/4 pointer-events-none transition-colors duration-500`} />
        {/* Grid sutil */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-xs w-full">
          {/* Logo */}
          <div className="mb-10 flex justify-start">
            <Logo size="lg" light />
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h2 className="text-4xl font-black text-white leading-tight mb-2">
              {cfg.headline}<br />
              <span className={`bg-gradient-to-r ${cfg.accent} bg-clip-text text-transparent`}>
                {cfg.sub}
              </span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              {cfg.desc}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-10">
            {cfg.features.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
                <span className="text-white/80 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-0 pt-8 border-t border-white/10">
            {cfg.stats.map((s, i) => (
              <div key={s.label} className={`flex-1 text-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size="md" /></Link>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-900">Crear cuenta</h1>
            <p className="text-gray-400 text-sm mt-1">Gratis, sin tarjeta de crédito.</p>
          </div>

          {/* ── Role selector — paso 1 ── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">¿Cómo quieres usar NegociClick?</p>
            <div className="grid grid-cols-2 gap-3">
              {(['CLIENT', 'VENDOR'] as Role[]).map(role => {
                const c = ROLE_CONFIG[role];
                const active = form.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRole(role)}
                    className={`relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      active
                        ? `${c.bgSelected} shadow-sm`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Check indicator */}
                    <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      active ? `${c.bgSelected} border-current ${c.checkColor}` : 'border-gray-300 bg-white'
                    }`}>
                      {active && <Check className="w-3 h-3" strokeWidth={3} />}
                    </div>

                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      role === 'CLIENT'
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {role === 'CLIENT'
                        ? <User className="w-5 h-5 text-white" />
                        : <Store className="w-5 h-5 text-white" />
                      }
                    </div>

                    {/* Text */}
                    <div>
                      <p className={`text-sm font-bold ${active ? (role === 'CLIENT' ? 'text-indigo-700' : 'text-emerald-700') : 'text-gray-800'}`}>
                        {c.roleLabel}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{c.roleSub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Card del formulario ── */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-7">

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3.5 text-sm mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {form.role === 'VENDOR' ? 'Tu nombre completo' : 'Nombre completo'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, name: true }))}
                    required
                    placeholder={form.role === 'VENDOR' ? 'Juan Pérez (dueño del negocio)' : 'Tu nombre'}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Teléfono{' '}
                  <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <div className="relative flex">
                  {/* Prefijo Perú */}
                  <div className="flex items-center gap-1.5 px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-600 font-medium flex-shrink-0">
                    <span className="text-base leading-none">🇵🇪</span>
                    <span>+51</span>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                      onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                      placeholder="987 654 321"
                      maxLength={9}
                      className="w-full border border-gray-200 rounded-r-xl pl-9 pr-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>
                {touched.phone && form.phone.length > 0 && form.phone.length !== 9 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Debe tener 9 dígitos
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    required
                    autoComplete="new-password"
                    placeholder="Crea una contraseña segura"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Barra de fuerza */}
                {form.password.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {/* Barra segmentada */}
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < pwdScore ? pwdBarColor : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    {/* Requisitos */}
                    <div className="flex gap-4">
                      {pwdRules.map(({ ok, label }) => (
                        <div key={label} className={`flex items-center gap-1 text-xs transition-colors ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${ok ? 'bg-green-500' : 'bg-gray-200'}`}>
                            {ok && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                          </div>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (form.password.length > 0 && !passwordValid)}
                className={`w-full bg-gradient-to-r ${cfg.btnColor} text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 mt-1`}
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>{cfg.btnLabel}</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            {/* Divisor + login */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">¿ya tienes cuenta?</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <Link
              href="/login"
              className="block w-full text-center py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-all"
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Legal */}
          <p className="text-center text-xs text-gray-400 mt-5 px-2">
            Al crear tu cuenta aceptas los{' '}
            <Link href="/terminos" className="text-indigo-500 hover:underline">Términos y Condiciones</Link>
            {' '}y la{' '}
            <Link href="/privacidad" className="text-indigo-500 hover:underline">Política de Privacidad</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  );
}
