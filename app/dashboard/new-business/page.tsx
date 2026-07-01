'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { ChevronLeft, Upload, X, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  {
    value: 'BARBERIA',
    label: 'Barbería',
    emoji: '✂️',
    description: 'Cortes, afeitado, arreglo de barba y más.',
    gradient: 'from-slate-500 to-slate-700',
  },
  {
    value: 'SPA',
    label: 'Spa',
    emoji: '🌿',
    description: 'Masajes, tratamientos faciales, relajación.',
    gradient: 'from-emerald-400 to-teal-600',
  },
  {
    value: 'SALON_BELLEZA',
    label: 'Salón de Belleza',
    emoji: '💅',
    description: 'Cortes, tintes, manicure, pedicure y más.',
    gradient: 'from-pink-400 to-rose-600',
  },
  {
    value: 'TIENDA_CELULARES',
    label: 'Tienda de Celulares',
    emoji: '📱',
    description: 'Reparación, venta de accesorios y técnico.',
    gradient: 'from-blue-400 to-cyan-600',
  },
  {
    value: 'VETERINARIA',
    label: 'Veterinaria',
    emoji: '🐾',
    description: 'Consultas, vacunas, cirugías y grooming para mascotas.',
    gradient: 'from-green-400 to-emerald-600',
  },
  {
    value: 'REPOSTERIA',
    label: 'Repostería',
    emoji: '🎂',
    description: 'Tortas, cupcakes, galletas y pedidos personalizados.',
    gradient: 'from-pink-300 to-rose-500',
  },
  {
    value: 'ODONTOLOGIA',
    label: 'Odontología',
    emoji: '🦷',
    description: 'Limpieza, blanqueamiento, extracciones y más.',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    value: 'GIMNASIO',
    label: 'Gimnasio / Fitness',
    emoji: '🏋️',
    description: 'Clases de yoga, pilates, spinning, entrenamiento personal y más.',
    gradient: 'from-orange-400 to-red-500',
  },
  {
    value: 'TATUAJES',
    label: 'Tatuajes & Piercing',
    emoji: '🎨',
    description: 'Tatuajes artísticos, retoques y piercing profesional.',
    gradient: 'from-violet-500 to-purple-700',
  },
  {
    value: 'PSICOLOGO',
    label: 'Psicólogo / Terapia',
    emoji: '🧠',
    description: 'Terapia individual, de pareja, familiar y online.',
    gradient: 'from-purple-400 to-indigo-600',
  },
  {
    value: 'NUTRICIONISTA',
    label: 'Nutricionista',
    emoji: '🥗',
    description: 'Planes alimenticios, control de peso y nutrición deportiva.',
    gradient: 'from-lime-400 to-green-600',
  },
  {
    value: 'PELUQUERIA_CANINA',
    label: 'Peluquería Canina',
    emoji: '🐕',
    description: 'Baño, corte, grooming y spa para tu mascota.',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    value: 'FISIOTERAPIA',
    label: 'Fisioterapia',
    emoji: '🦺',
    description: 'Rehabilitación, lesiones deportivas y terapia física.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    value: 'MICROPIGMENTACION',
    label: 'Micropigmentación',
    emoji: '🖌️',
    description: 'Micropigmentación de cejas, labios y delineado permanente.',
    gradient: 'from-rose-400 to-pink-600',
  },
  {
    value: 'CLASES_PARTICULARES',
    label: 'Clases Particulares',
    emoji: '📚',
    description: 'Tutorías, refuerzo escolar y clases universitarias.',
    gradient: 'from-blue-500 to-violet-600',
  },
  {
    value: 'LIMPIEZA_HOGAR',
    label: 'Limpieza del Hogar',
    emoji: '🧹',
    description: 'Limpieza profunda, mantenimiento y organización del hogar.',
    gradient: 'from-sky-400 to-cyan-500',
  },
  {
    value: 'MAQUILLAJE',
    label: 'Maquillaje Profesional',
    emoji: '💄',
    description: 'Maquillaje para bodas, graduaciones, eventos y sesiones fotográficas.',
    gradient: 'from-fuchsia-400 to-pink-600',
  },
  {
    value: 'DJ',
    label: 'DJ / Animación',
    emoji: '🎧',
    description: 'DJ profesional para fiestas, bodas, quinceañeros y eventos.',
    gradient: 'from-purple-500 to-fuchsia-600',
  },
  {
    value: 'DECORACION_EVENTOS',
    label: 'Decoración de Eventos',
    emoji: '🎊',
    description: 'Decoración temática, globos, centros de mesa y ambientación.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    value: 'CATERING',
    label: 'Catering / Chef',
    emoji: '🍽️',
    description: 'Chef a domicilio y catering para eventos y reuniones.',
    gradient: 'from-orange-400 to-amber-600',
  },
  {
    value: 'GASFITERIA',
    label: 'Gasfitería',
    emoji: '🔧',
    description: 'Instalación y reparación de tuberías, desagüe y agua.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    value: 'CARPINTERIA',
    label: 'Carpintería',
    emoji: '🪚',
    description: 'Muebles a medida, reparaciones y trabajos en madera.',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    value: 'JARDINERIA',
    label: 'Jardinería',
    emoji: '🌱',
    description: 'Mantenimiento de jardines, poda y paisajismo.',
    gradient: 'from-green-500 to-emerald-700',
  },
  {
    value: 'ELECTRICIDAD',
    label: 'Electricidad',
    emoji: '⚡',
    description: 'Instalaciones eléctricas, reparaciones y mantenimiento.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    value: 'DEPILACION',
    label: 'Depilación',
    emoji: '🪒',
    description: 'Depilación con cera, láser, hilo y más.',
    gradient: 'from-violet-400 to-purple-600',
  },
  {
    value: 'MASAJES_DOMICILIO',
    label: 'Masajes a Domicilio',
    emoji: '💆',
    description: 'Masajes relajantes y terapéuticos en la comodidad de tu hogar.',
    gradient: 'from-teal-400 to-emerald-600',
  },
  {
    value: 'NAIL_ART',
    label: 'Uñas / Nail Art',
    emoji: '💅',
    description: 'Uñas acrílicas, gel, nail art y diseño de uñas profesional.',
    gradient: 'from-pink-400 to-fuchsia-500',
  },
  {
    value: 'FLORES',
    label: 'Venta de Flores',
    emoji: '🌸',
    description: 'Ramos, arreglos florales, bouquets y flores preservadas para toda ocasión.',
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    value: 'TEJIDOS_CROCHET',
    label: 'Tejidos a Crochet',
    emoji: '🧶',
    description: 'Bolsos, mantas, amigurumis y accesorios tejidos a crochet artesanal.',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    value: 'ENTRENADOR_PERSONAL',
    label: 'Entrenador Personal',
    emoji: '🏃',
    description: 'Entrenamiento físico personalizado, rutinas y coaching deportivo.',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    value: 'FOTOGRAFIA',
    label: 'Fotografía',
    emoji: '📷',
    description: 'Sesiones fotográficas, eventos, retratos y fotografía profesional.',
    gradient: 'from-gray-500 to-slate-700',
  },
  {
    value: 'MUDANZAS',
    label: 'Mudanzas',
    emoji: '📦',
    description: 'Servicio de mudanza, traslado de muebles y embalaje profesional.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    value: 'FUMIGACION',
    label: 'Fumigación',
    emoji: '🪲',
    description: 'Control de plagas, fumigación de hogares y locales comerciales.',
    gradient: 'from-green-600 to-teal-700',
  },
  {
    value: 'CLASES_MUSICA',
    label: 'Clases de Música',
    emoji: '🎸',
    description: 'Clases de guitarra, piano, canto, batería y otros instrumentos.',
    gradient: 'from-indigo-400 to-blue-600',
  },
  {
    value: 'CLASES_BAILE',
    label: 'Clases de Baile',
    emoji: '💃',
    description: 'Salsa, cumbia, marinera, bachata, contemporáneo y más.',
    gradient: 'from-pink-500 to-fuchsia-600',
  },
  {
    value: 'ANIMACION_INFANTIL',
    label: 'Animación Infantil',
    emoji: '🎈',
    description: 'Payasos, magos, animadores y shows para fiestas infantiles.',
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    value: 'OTRO',
    label: 'Otro',
    emoji: '🏪',
    description: 'Cualquier otro tipo de negocio o servicio.',
    gradient: 'from-amber-400 to-orange-500',
  },
];

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: i === 0,
}));

export default function NewBusinessPage() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<string>('FREE');
  const [form, setForm] = useState({
    name: '', slogan: '', description: '', category: '',
    address: '', city: '', phone: '', email: '',
  });
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/subscriptions/my')
      .then(res => setPlan(res.data.subscription?.plan ?? 'FREE'))
      .catch(() => setPlan('FREE'));
  }, []);

  const isPro = plan === 'PRO' || plan === 'PREMIUM';
  const selectedCategory = CATEGORIES.find(c => c.value === form.category);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const toggleDay = (dayOfWeek: number) =>
    setHours(h => h.map(d => d.dayOfWeek === dayOfWeek ? { ...d, isClosed: !d.isClosed } : d));

  const setHourField = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) =>
    setHours(h => h.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/businesses', form);
      const businessId = res.data.business.id;
      await Promise.all([
        isPro && coverFile
          ? api.post(`/businesses/${businessId}/cover`, (() => {
              const fd = new FormData();
              fd.append('cover', coverFile);
              return fd;
            })(), { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {})
          : Promise.resolve(),
        api.put(`/businesses/${businessId}/hours`, hours).catch(() => {}),
      ]);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear negocio');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Volver al dashboard
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === n ? 'bg-indigo-600 text-white' :
                step > n  ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > n ? '✓' : n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>
                {n === 1 ? 'Tipo de negocio' : 'Datos del negocio'}
              </span>
              {n < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          {/* ── STEP 1: Selector de categoría ── */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">¿Qué tipo de negocio tienes?</h1>
              <p className="text-gray-500 text-sm mb-6">Selecciona tu categoría para obtener un dashboard adaptado a tu negocio.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map(cat => {
                  const isSelected = form.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => set('category', cat.value)}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl mb-3 shadow-sm`}>
                        {cat.emoji}
                      </div>
                      <p className={`font-bold text-sm mb-1 ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {cat.label}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">{cat.description}</p>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.category}
                className="w-full mt-6 bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuar con {selectedCategory?.label ?? '...'} <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ── STEP 2: Datos del negocio ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedCategory?.gradient} flex items-center justify-center text-xl shadow-sm`}>
                  {selectedCategory?.emoji}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedCategory?.label}</h1>
                  <button onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:underline">
                    Cambiar categoría
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Foto de portada — solo PRO/PREMIUM */}
                {isPro && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Foto de portada</label>
                    <div
                      className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50 group"
                      onClick={() => !coverPreview && coverInputRef.current?.click()}
                    >
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
                          <button type="button" onClick={e => { e.stopPropagation(); removeCover(); }}
                            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition">
                            <X className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={e => { e.stopPropagation(); coverInputRef.current?.click(); }}
                            className="absolute bottom-2 right-2 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition">
                            <Upload className="w-3.5 h-3.5" /> Cambiar
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          <Upload className="w-8 h-8 text-gray-300" />
                          <p className="text-sm text-gray-500 font-medium">Subir foto de portada</p>
                          <p className="text-xs text-gray-400">JPG, PNG o WebP · máx. 5 MB</p>
                        </div>
                      )}
                    </div>
                    <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverChange} className="hidden" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del negocio *</label>
                    <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder={`Ej: ${selectedCategory?.emoji} ${selectedCategory?.label} El Estilo`} className={inputClass} />
                  </div>

                  {isPro && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slogan</label>
                      <input type="text" maxLength={80} value={form.slogan} onChange={e => set('slogan', e.target.value)}
                        placeholder="Ej: El mejor servicio, garantizado." className={inputClass} />
                      <p className="text-xs text-gray-400 mt-1">{form.slogan.length}/80 caracteres</p>
                    </div>
                  )}

                  {isPro && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                      <textarea rows={3} maxLength={500} value={form.description} onChange={e => set('description', e.target.value)}
                        placeholder="Describe tu negocio y qué servicios ofreces..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none" />
                      <p className="text-xs text-gray-400 mt-1">{form.description.length}/500 caracteres</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono *</label>
                    <input type="tel" required value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="983081196" maxLength={9} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ciudad *</label>
                    <input type="text" required value={form.city} onChange={e => set('city', e.target.value)}
                      placeholder="Lima" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email de contacto</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="negocio@email.com" className={inputClass} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección *</label>
                    <input type="text" required value={form.address} onChange={e => set('address', e.target.value)}
                      placeholder="Av. Javier Prado 123, San Isidro" className={inputClass} />
                  </div>
                </div>

                {/* ── Horarios de atención ── */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Horarios de atención
                  </label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {hours.map(h => (
                      <div
                        key={h.dayOfWeek}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${h.isClosed ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        {/* Toggle open/closed */}
                        <button
                          type="button"
                          onClick={() => toggleDay(h.dayOfWeek)}
                          className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${h.isClosed ? 'bg-gray-200' : 'bg-indigo-500'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.isClosed ? 'translate-x-0' : 'translate-x-5'}`} />
                        </button>

                        {/* Día */}
                        <span className={`text-sm font-medium w-24 flex-shrink-0 ${h.isClosed ? 'text-gray-400' : 'text-gray-700'}`}>
                          {DAY_NAMES[h.dayOfWeek]}
                        </span>

                        {/* Horas o "Cerrado" */}
                        {h.isClosed ? (
                          <span className="text-xs text-gray-400 italic">Cerrado</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={h.openTime}
                              onChange={e => setHourField(h.dayOfWeek, 'openTime', e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            />
                            <span className="text-gray-400 text-xs font-medium">a</span>
                            <input
                              type="time"
                              value={h.closeTime}
                              onChange={e => setHourField(h.dayOfWeek, 'closeTime', e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Puedes modificar los horarios en cualquier momento desde tu dashboard.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                    Atrás
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando...</>
                      : 'Crear negocio'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
