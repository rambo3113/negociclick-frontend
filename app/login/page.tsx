'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import GoogleIcon from '@/components/GoogleIcon';
import api from '@/lib/api';
import {
  Eye, EyeOff, AlertCircle, ArrowRight,
  Mail, Lock, User, Store,
  ShieldCheck, Clock, Star, TrendingUp, Calendar, Sparkles,
  Smartphone,
} from 'lucide-react';

type Role = 'CLIENT' | 'VENDOR';

const ROLE_CONFIG = {
  CLIENT: {
    gradient:    'from-slate-900 via-indigo-950 to-violet-950',
    blob1:       'bg-indigo-600/20',
    blob2:       'bg-violet-600/20',
    accent:      'from-indigo-300 to-violet-300',
    headline:    'Tu próxima cita,',
    sub:         'a un clic',
    desc:        'Encuentra los mejores servicios en Lima, compara y agenda en segundos.',
    features: [
      { Icon: Star,        text: 'Reseñas reales de clientes verificados' },
      { Icon: Clock,       text: 'Agenda en menos de 60 segundos' },
      { Icon: ShieldCheck, text: 'Pagos 100% seguros con Culqi' },
      { Icon: Calendar,    text: 'Recordatorio automático antes de tu cita' },
    ],
    stats: [
      { value: '36+',  label: 'Categorías' },
      { value: '4.8★', label: 'Rating promedio' },
      { value: '100%', label: 'Pago seguro' },
    ],
    welcome:       'Bienvenido de vuelta',
    welcomeSub:    'Ingresa para ver tus reservas y descubrir nuevos servicios.',
    btnLabel:      'Ingresar a mi cuenta',
    btnColor:      'from-indigo-600 to-violet-600',
    btnShadow:     'hover:shadow-indigo-200',
    tabActive:     'bg-indigo-600 text-white shadow-sm',
    tabIcon:       <User className="w-3.5 h-3.5" />,
    registerHref:  '/register?role=CLIENT',
    registerCta:   '¿No tienes cuenta? Regístrate gratis',
  },
  VENDOR: {
    gradient:    'from-slate-900 via-emerald-950 to-teal-950',
    blob1:       'bg-emerald-600/20',
    blob2:       'bg-teal-600/20',
    accent:      'from-emerald-300 to-teal-300',
    headline:    'Gestiona tu negocio',
    sub:         'sin complicaciones',
    desc:        'Tu dashboard, reservas, clientes e ingresos en un solo lugar.',
    features: [
      { Icon: TrendingUp,  text: 'Panel de reservas y estadísticas en tiempo real' },
      { Icon: Calendar,    text: 'Gestiona tu agenda y disponibilidad' },
      { Icon: Sparkles,    text: 'Sube fotos y personaliza tu perfil' },
      { Icon: ShieldCheck, text: 'Cobros seguros sin comisiones extra' },
    ],
    stats: [
      { value: 'S/0',   label: 'Sin costos fijos' },
      { value: '24/7',  label: 'Reservas online' },
      { value: '0%',    label: 'Comisión' },
    ],
    welcome:       'Panel de tu negocio',
    welcomeSub:    'Ingresa para gestionar tus reservas, servicios e ingresos.',
    btnLabel:      'Ingresar al panel',
    btnColor:      'from-emerald-600 to-teal-600',
    btnShadow:     'hover:shadow-emerald-200',
    tabActive:     'bg-emerald-600 text-white shadow-sm',
    tabIcon:       <Store className="w-3.5 h-3.5" />,
    registerHref:  '/register?role=VENDOR',
    registerCta:   '¿Aún no tienes cuenta? Publica tu negocio gratis',
  },
} as const;

export default function LoginPage() {
  const { login, completeLogin } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [twoFactorMode, setTwoFactorMode] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupMode, setBackupMode] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const cfg = ROLE_CONFIG[role];

  // Retomar el flujo si venimos de /auth/google/finish: puede traer un error,
  // o un pedido de 2FA (el tempToken viaja por sessionStorage, no por la URL).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get('error');
    if (errParam) setError(errParam);
    if (params.get('google2fa') === '1') {
      const stored = sessionStorage.getItem('google2faTempToken');
      if (stored) {
        sessionStorage.removeItem('google2faTempToken');
        setTempToken(stored);
        setTwoFactorMode(true);
      }
    }
  }, []);

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError('');
    signIn('google', { callbackUrl: '/auth/google/finish' });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requiresTwoFactor) {
        setTempToken(result.tempToken);
        setTwoFactorMode(true);
        setLoading(false);
        return;
      }
      router.push(role === 'VENDOR' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!totpCode || (backupMode ? totpCode.length < 8 : totpCode.length < 6)) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/2fa/verify-login', { code: totpCode }, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      const { token, refreshToken, user } = res.data;
      completeLogin(token, refreshToken, user);
      router.push(role === 'VENDOR' ? '/dashboard' : '/');
    } catch (err: any) {
      const msg: string = err.response?.data?.error || 'Código incorrecto. Intenta de nuevo.';
      // Token expirado → volver al paso 1
      if (msg.toLowerCase().includes('expirado') || msg.toLowerCase().includes('inválido')) {
        setTwoFactorMode(false);
        setTotpCode('');
        setBackupMode(false);
        setError('Tu sesión de verificación expiró (5 min). Inicia sesión nuevamente.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — dinámico ── */}
      <div className={`hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br ${cfg.gradient} flex-col items-center justify-center p-12 transition-all duration-500`}>
        {/* Blobs */}
        <div className={`absolute top-0 left-0 w-[480px] h-[480px] ${cfg.blob1} rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none transition-colors duration-500`} />
        <div className={`absolute bottom-0 right-0 w-[380px] h-[380px] ${cfg.blob2} rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none transition-colors duration-500`} />
        {/* Grid sutil */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-xs w-full">
          <div className="mb-10 flex justify-start">
            <Logo size="lg" light />
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-black text-white leading-tight mb-2">
              {cfg.headline}<br />
              <span className={`bg-gradient-to-r ${cfg.accent} bg-clip-text text-transparent`}>
                {cfg.sub}
              </span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">{cfg.desc}</p>
          </div>

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
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/"><Logo size="md" /></Link>
          </div>

          {/* ── Selector de rol (tab pill) ── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">¿Cómo deseas ingresar?</p>
            <div className="inline-flex w-full bg-gray-100 rounded-2xl p-1">
              {(['CLIENT', 'VENDOR'] as Role[]).map(r => {
                const c = ROLE_CONFIG[r];
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active ? c.tabActive : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {c.tabIcon}
                    {r === 'CLIENT' ? 'Cliente' : 'Negocio'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Card formulario ── */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-7">

            {/* Header contextual */}
            <div className="mb-6">
              <h1 className="text-2xl font-black text-gray-900">{cfg.welcome}</h1>
              <p className="text-gray-400 text-sm mt-1 leading-snug">{cfg.welcomeSub}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3.5 text-sm mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {twoFactorMode ? (
              /* ── Paso 2: verificar código 2FA ── */
              <form onSubmit={handle2FASubmit} className="space-y-4" noValidate>
                <div className="flex flex-col items-center text-center mb-2">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                    <Smartphone className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-600 leading-snug">
                    {backupMode
                      ? <>Ingresa uno de tus <strong>códigos de respaldo</strong> de 8 caracteres.</>
                      : <>Ingresa el <strong>código de 6 dígitos</strong> de tu app autenticadora.</>
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {backupMode ? 'Código de respaldo' : 'Código de verificación'}
                  </label>
                  <input
                    type="text"
                    value={totpCode}
                    onChange={e => {
                      const val = backupMode
                        ? e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 8)
                        : e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTotpCode(val);
                      // Auto-submit TOTP at 6 digits
                      if (!backupMode && val.length === 6) {
                        setTimeout(() => handle2FASubmit(), 0);
                      }
                    }}
                    required
                    autoFocus
                    autoComplete={backupMode ? 'off' : 'one-time-code'}
                    placeholder={backupMode ? 'A1B2C3D4' : '000000'}
                    maxLength={backupMode ? 8 : 6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-gray-900 bg-gray-50 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || (backupMode ? totpCode.length < 8 : totpCode.length < 6)}
                  className={`w-full bg-gradient-to-r ${cfg.btnColor} text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 hover:shadow-lg ${cfg.btnShadow} hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2`}
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><span>Verificar y entrar</span><ArrowRight className="w-4 h-4" /></>
                  }
                </button>

                <button
                  type="button"
                  onClick={() => { setBackupMode(m => !m); setTotpCode(''); setError(''); }}
                  className="w-full text-center text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
                >
                  {backupMode ? '← Usar código del autenticador' : 'Usar un código de respaldo'}
                </button>

                <button
                  type="button"
                  onClick={() => { setTwoFactorMode(false); setTotpCode(''); setBackupMode(false); setError(''); }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </form>
            ) : (
              /* ── Paso 1: Google + email/contraseña ── */
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-5"
                >
                  {googleLoading
                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    : <GoogleIcon className="w-4 h-4" />}
                  Continuar con Google
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">o continúa con email</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="tu@email.com"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Contraseña</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Tu contraseña"
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
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r ${cfg.btnColor} text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 hover:shadow-lg ${cfg.btnShadow} hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 mt-1`}
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><span>{cfg.btnLabel}</span><ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>
              </>
            )}

            {/* Divisor */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">¿nuevo en NegociClick?</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* CTA registro */}
            <Link
              href={cfg.registerHref}
              className="block w-full text-center py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-all"
            >
              {cfg.registerCta}
            </Link>
          </div>

          {/* Legal */}
          <p className="text-center text-xs text-gray-400 mt-5 px-2">
            Al ingresar aceptas nuestros{' '}
            <Link href="/terminos" className="text-indigo-500 hover:underline">Términos y Condiciones</Link>
            {' '}y la{' '}
            <Link href="/privacidad" className="text-indigo-500 hover:underline">Política de Privacidad</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
