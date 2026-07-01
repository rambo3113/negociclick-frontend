'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { MapPin, Star, Search, ArrowRight, SlidersHorizontal, X, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  averageRating: number | null;
  totalReviews: number;
  description?: string;
  minPrice?: number | null;
  coverImage?: string | null;
  featured?: boolean;
}

const CATEGORY_META: Record<string, { label: string; emoji: string; gradient: string }> = {
  TODOS:            { label: 'Todos',            emoji: '✨', gradient: 'from-indigo-500 to-purple-600' },
  BARBERIA:         { label: 'Barbería',          emoji: '✂️', gradient: 'from-slate-500 to-slate-700' },
  SPA:              { label: 'Spa',              emoji: '🌿', gradient: 'from-emerald-400 to-teal-600' },
  SALON_BELLEZA:    { label: 'Salón de Belleza', emoji: '💅', gradient: 'from-pink-400 to-rose-600' },
  TIENDA_CELULARES: { label: 'Celulares',        emoji: '📱', gradient: 'from-blue-400 to-cyan-600' },
  VETERINARIA:      { label: 'Veterinaria',      emoji: '🐾', gradient: 'from-green-400 to-emerald-600' },
  REPOSTERIA:       { label: 'Repostería',       emoji: '🎂', gradient: 'from-pink-300 to-rose-500' },
  ODONTOLOGIA:      { label: 'Odontología',      emoji: '🦷', gradient: 'from-cyan-400 to-blue-500' },
  GIMNASIO:         { label: 'Gimnasio / Fitness', emoji: '🏋️', gradient: 'from-orange-400 to-red-500' },
  TATUAJES:         { label: 'Tatuajes',         emoji: '🎨', gradient: 'from-violet-500 to-purple-700' },
  PSICOLOGO:        { label: 'Psicólogo',        emoji: '🧠', gradient: 'from-purple-400 to-indigo-600' },
  NUTRICIONISTA:    { label: 'Nutricionista',    emoji: '🥗', gradient: 'from-lime-400 to-green-600' },
  PELUQUERIA_CANINA:  { label: 'Peluquería Canina',    emoji: '🐕', gradient: 'from-yellow-400 to-amber-500' },
  FISIOTERAPIA:       { label: 'Fisioterapia',         emoji: '🦺', gradient: 'from-blue-400 to-indigo-500' },
  MICROPIGMENTACION:  { label: 'Micropigmentación',    emoji: '🖌️', gradient: 'from-rose-400 to-pink-600' },
  CLASES_PARTICULARES:{ label: 'Clases Particulares',  emoji: '📚', gradient: 'from-blue-500 to-violet-600' },
  LIMPIEZA_HOGAR:     { label: 'Limpieza del Hogar',   emoji: '🧹', gradient: 'from-sky-400 to-cyan-500' },
  MAQUILLAJE:          { label: 'Maquillaje',           emoji: '💄', gradient: 'from-fuchsia-400 to-pink-600' },
  DJ:                  { label: 'DJ / Animación',       emoji: '🎧', gradient: 'from-purple-500 to-fuchsia-600' },
  DECORACION_EVENTOS:  { label: 'Decoración Eventos',   emoji: '🎊', gradient: 'from-pink-500 to-rose-600' },
  CATERING:            { label: 'Catering / Chef',      emoji: '🍽️', gradient: 'from-orange-400 to-amber-600' },
  GASFITERIA:          { label: 'Gasfitería',           emoji: '🔧', gradient: 'from-blue-500 to-cyan-600' },
  CARPINTERIA:         { label: 'Carpintería',          emoji: '🪚', gradient: 'from-amber-600 to-orange-700' },
  JARDINERIA:          { label: 'Jardinería',           emoji: '🌱', gradient: 'from-green-500 to-emerald-700' },
  ELECTRICIDAD:        { label: 'Electricidad',         emoji: '⚡', gradient: 'from-yellow-400 to-orange-500' },
  DEPILACION:          { label: 'Depilación',           emoji: '🪒', gradient: 'from-violet-400 to-purple-600' },
  MASAJES_DOMICILIO:   { label: 'Masajes a Domicilio',  emoji: '💆', gradient: 'from-teal-400 to-emerald-600' },
  NAIL_ART:            { label: 'Uñas / Nail Art',      emoji: '💅', gradient: 'from-pink-400 to-fuchsia-500' },
  FLORES:              { label: 'Venta de Flores',      emoji: '🌸', gradient: 'from-rose-400 to-pink-500' },
  TEJIDOS_CROCHET:     { label: 'Tejidos a Crochet',    emoji: '🧶', gradient: 'from-violet-400 to-purple-500' },
  OTRO:                { label: 'Otros',                emoji: '🏪', gradient: 'from-amber-400 to-orange-500' },
};
const CATEGORIES = Object.keys(CATEGORY_META);

const HERO_WORDS = [
  'barberos', 'dentistas', 'masajistas', 'gimnasios',
  'nutricionistas', 'tatuadores', 'psicólogos', 'chefs',
  'electricistas', 'jardineros', 'nail artists', 'DJ\'s',
];

const PRO_PERIODS = [
  { key: 'monthly', label: 'Mensual', perMonth: 29.99, save: null,            total: 29.99,  months: 1 },
  { key: '3months', label: '3 meses', perMonth: 26.99, save: 'Ahorras S/ 9',  total: 80.97,  months: 3 },
  { key: '6months', label: '6 meses', perMonth: 23.99, save: 'Ahorras S/ 36', total: 143.94, months: 6 },
] as const;

const PREMIUM_PERIODS = [
  { key: 'monthly', label: 'Mensual', perMonth: 79.99, save: null,              total: 79.99,  months: 1  },
  { key: 'annual',  label: 'Anual',   perMonth: 63.99, save: 'Ahorras S/ 192', total: 767.88, months: 12 },
] as const;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
      </div>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

const _UPLOADS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace('/api', '');
const resolveUrl = (path?: string | null) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${_UPLOADS_BASE}${path}`;
};

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('TODOS');
  const [city, setCity] = useState('TODAS');
  const [minRating, setMinRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [heroWordIdx, setHeroWordIdx] = useState(0);
  const [heroFade, setHeroFade] = useState(true);
  const [proPeriod, setProPeriod] = useState<'monthly' | '3months' | '6months'>('monthly');
  const [premiumPeriod, setPremiumPeriod] = useState<'monthly' | 'annual'>('monthly');
  const proData = PRO_PERIODS.find(x => x.key === proPeriod)!;
  const premData = PREMIUM_PERIODS.find(x => x.key === premiumPeriod)!;

  // Rotación de palabra en el hero
  useEffect(() => {
    const iv = setInterval(() => {
      setHeroFade(false);
      setTimeout(() => {
        setHeroWordIdx(i => (i + 1) % HERO_WORDS.length);
        setHeroFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  // Auto-scroll del carrusel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el || carouselPaused) return;
    const interval = setInterval(() => {
      el.scrollLeft += 1;
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }
    }, 20);
    return () => clearInterval(interval);
  }, [carouselPaused]);

  const scrollCarousel = (dir: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' });
  };

  const cities = ['TODAS', ...Array.from(new Set(businesses.map(b => b.city).filter(Boolean))).sort()];
  const hasActiveFilters = minRating !== '' || minPrice !== '' || maxPrice !== '' || sortBy !== 'featured';

  const fetchBusinesses = useCallback((p = page) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: '12' };
    if (search)               params.search    = search;
    if (category !== 'TODOS') params.category  = category;
    if (city !== 'TODAS')     params.city      = city;
    if (minRating)            params.minRating = minRating;
    if (minPrice)             params.minPrice  = minPrice;
    if (maxPrice)             params.maxPrice  = maxPrice;
    if (sortBy !== 'featured') params.sortBy   = sortBy;

    api.get('/businesses', { params })
      .then(res => {
        setBusinesses(res.data.businesses ?? []);
        setTotal(res.data.total ?? 0);
        setPages(res.data.pages ?? 1);
      })
      .catch(() => { setBusinesses([]); setTotal(0); setPages(1); })
      .finally(() => setLoading(false));
  }, [search, category, city, minRating, minPrice, maxPrice, sortBy, page]);

  // Debounce search; reset page on filter change
  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchBusinesses(1), 300);
    return () => clearTimeout(t);
  }, [search, category, city, minRating, minPrice, maxPrice, sortBy]); // eslint-disable-line

  // Page change without debounce
  useEffect(() => {
    fetchBusinesses(page);
  }, [page]); // eslint-disable-line

  const clearAll = () => {
    setSearch(''); setCategory('TODOS'); setCity('TODAS');
    setMinRating(''); setMinPrice(''); setMaxPrice('');
    setSortBy('featured'); setPage(1); setShowFilters(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-7">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Lima, Perú · Reservas en tiempo real
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-5 leading-[1.1] tracking-tight">
            Reserva los mejores<br />
            <span
              className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent inline-block transition-opacity duration-300"
              style={{ opacity: heroFade ? 1 : 0 }}
            >
              {HERO_WORDS[heroWordIdx]}
            </span>
            <span className="text-white"> cerca de ti</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
            Más de 27 categorías de servicios en Lima. Encuentra, reserva y paga seguro en segundos.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
                <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Busca barbería, corte de pelo, spa..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 px-3 py-4 text-gray-800 text-base placeholder-gray-400 focus:outline-none bg-transparent min-w-0"
                />
                {cities.length > 2 && (
                  <div className="border-l border-gray-100 flex-shrink-0">
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="h-full px-3 py-4 text-sm text-gray-600 bg-transparent focus:outline-none cursor-pointer pr-8"
                    >
                      {cities.map(c => (
                        <option key={c} value={c}>{c === 'TODAS' ? 'Toda Lima' : c}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`border-l border-gray-100 px-4 py-4 flex items-center gap-1.5 text-sm font-medium transition-colors flex-shrink-0 ${showFilters || hasActiveFilters ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {hasActiveFilters && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
                </button>
                {(search || city !== 'TODAS') && (
                  <button onClick={clearAll} className="mr-3 text-gray-300 hover:text-gray-500 transition flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Advanced filters panel */}
            {showFilters && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-wrap gap-4 text-left">

                {/* Rating */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Rating mínimo</label>
                  <div className="flex gap-2 flex-wrap">
                    {['', '3', '4', '4.5'].map(v => (
                      <button key={v} onClick={() => setMinRating(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${minRating === v ? 'bg-yellow-400 text-gray-900' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                        {v === '' ? 'Todos' : `${v}★+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Precio mín */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Precio mín. (S/)</label>
                  <div className="flex gap-2 flex-wrap">
                    {['', '20', '50', '100'].map(v => (
                      <button key={v} onClick={() => setMinPrice(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${minPrice === v ? 'bg-emerald-400 text-gray-900' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                        {v === '' ? 'Todos' : `≥ ${v}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Precio máx */}
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Precio máx. (S/)</label>
                  <div className="flex gap-2 flex-wrap">
                    {['', '50', '100', '200'].map(v => (
                      <button key={v} onClick={() => setMaxPrice(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${maxPrice === v ? 'bg-indigo-400 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                        {v === '' ? 'Todos' : `≤ ${v}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ordenar por */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-white/60 mb-1.5">Ordenar por</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { v: 'featured',   label: '⭐ Destacados' },
                      { v: 'rating',     label: '🏆 Mejor rating' },
                      { v: 'price_asc',  label: '💰 Menor precio' },
                      { v: 'price_desc', label: '💎 Mayor precio' },
                      { v: 'newest',     label: '🆕 Más nuevos' },
                      { v: 'popular',    label: '🔥 Populares' },
                    ].map(({ v, label }) => (
                      <button key={v} onClick={() => setSortBy(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === v ? 'bg-white text-indigo-700' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button onClick={() => { setMinRating(''); setMinPrice(''); setMaxPrice(''); setSortBy('featured'); }}
                    className="self-end text-xs text-white/50 hover:text-white transition">
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mt-10 flex-wrap">
            {[
              { value: '27+', label: 'Categorías' },
              { value: `${businesses.length || '100+'}`, label: 'Negocios activos' },
              { value: '4.8★', label: 'Calificación promedio' },
              { value: '100%', label: 'Pago seguro' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto w-full">

            {/* ── FREE ── */}
            <div className="group relative rounded-2xl p-5 text-left flex flex-col bg-white/10 backdrop-blur-sm border border-white/15 transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-white/[0.16] hover:border-white/30 hover:shadow-2xl hover:shadow-black/40 cursor-pointer">
              <p className="text-xs font-black uppercase tracking-widest mb-1 text-white/40">Free</p>
              <p className="text-3xl font-black text-white">S/ 0</p>
              <p className="text-[11px] text-white/35 mb-4">siempre gratis</p>
              <ul className="space-y-2 flex-1">
                {[
                  { text: 'Hasta 5 servicios', ok: true },
                  { text: 'Perfil de negocio básico', ok: true },
                  { text: 'Reservas de citas', ok: false },
                  { text: 'Método de pago', ok: false },
                  { text: 'Soporte prioritario', ok: false },
                  { text: 'Estadísticas avanzadas', ok: false },
                ].map(f => (
                  <li key={f.text} className={`text-xs flex items-center gap-2 ${f.ok ? 'text-white/65' : 'text-white/25 line-through'}`}>
                    {f.ok ? <span className="text-emerald-400 font-black flex-shrink-0">✓</span> : <span className="text-white/20 flex-shrink-0">✕</span>}
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-5 block text-center text-xs font-black py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all duration-200 group-hover:border-white/40 group-hover:bg-white/15">
                Empezar gratis
              </Link>
            </div>

            {/* ── PRO ── */}
            <div className="group relative rounded-2xl p-5 text-left flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-400/60 shadow-xl shadow-indigo-900/40 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_24px_64px_rgba(99,102,241,0.65)] hover:border-indigo-300/80 hover:from-indigo-400 hover:to-purple-500 cursor-pointer">
              <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full">Más popular</span>
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-white/80">Pro</p>

              <div className="flex gap-0.5 bg-white/15 rounded-lg p-0.5 mb-3">
                {PRO_PERIODS.map(p => (
                  <button key={p.key} onClick={() => setProPeriod(p.key)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${proPeriod === p.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/70 hover:text-white'}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="h-4 flex items-center mb-0.5">
                {proData.key !== 'monthly' && (
                  <span className="text-xs text-white/40 line-through">S/ 29.99 / mes</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-black text-white">S/ {proData.perMonth.toFixed(2)}</span>
                <span className="text-white/60 text-xs">/ mes</span>
              </div>
              {proData.save
                ? <span className="inline-flex text-[10px] font-black bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full mb-1 w-fit">🎉 {proData.save}</span>
                : <span className="mb-1 block h-4" />
              }
              <p className="text-[10px] text-white/50 mb-3">
                {proData.key === 'monthly' ? 'Cancela cuando quieras' : `Total S/ ${proData.total.toFixed(2)} · ${proData.months} meses`}
              </p>

              <ul className="space-y-2 flex-1">
                {[
                  { text: 'Hasta 15 servicios', ok: true },
                  { text: 'Perfil destacado en búsquedas', ok: true },
                  { text: 'Reservas ilimitadas', ok: true },
                  { text: 'Soporte prioritario', ok: true },
                  { text: 'Estadísticas avanzadas', ok: false },
                ].map(f => (
                  <li key={f.text} className={`text-xs flex items-center gap-2 ${f.ok ? 'text-white/90' : 'text-white/25 line-through'}`}>
                    {f.ok ? <span className="text-emerald-400 font-black flex-shrink-0">✓</span> : <span className="text-white/20 flex-shrink-0">✕</span>}
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-5 block text-center text-xs font-black py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-indigo-900/30 group-hover:scale-[1.02]">
                Activar Pro
              </Link>
            </div>

            {/* ── PREMIUM ── */}
            <div className="group relative rounded-2xl p-5 text-left flex flex-col bg-white/10 backdrop-blur-sm border border-amber-400/30 transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-white/[0.16] hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-900/40 cursor-pointer">
              <span className="absolute top-3 right-3 bg-amber-400/90 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">Mejor valor</span>
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-white/40">Premium</p>

              <div className="flex gap-0.5 bg-white/10 rounded-lg p-0.5 mb-3 relative mt-1">
                {PREMIUM_PERIODS.map(p => (
                  <button key={p.key} onClick={() => setPremiumPeriod(p.key)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all relative ${premiumPeriod === p.key ? 'bg-amber-500 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}>
                    {p.key === 'annual' && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        20% off
                      </span>
                    )}
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="h-4 flex items-center mb-0.5">
                {premData.key !== 'monthly' && (
                  <span className="text-xs text-white/40 line-through">S/ 79.99 / mes</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-3xl font-black text-white">S/ {premData.perMonth.toFixed(2)}</span>
                <span className="text-white/60 text-xs">/ mes</span>
              </div>
              {premData.save
                ? <span className="inline-flex text-[10px] font-black bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full mb-1 w-fit">🎉 {premData.save}</span>
                : <span className="mb-1 block h-4" />
              }
              <p className="text-[10px] text-white/35 mb-3">
                {premData.key === 'monthly' ? 'por mes, sin compromiso' : `Total S/ ${premData.total.toFixed(2)} · ${premData.months} meses`}
              </p>

              <ul className="space-y-2 flex-1">
                {[
                  { text: 'Servicios ilimitados', ok: true },
                  { text: 'Posición top en búsquedas', ok: true },
                  { text: 'Reservas ilimitadas', ok: true },
                  { text: 'Soporte 24/7', ok: true },
                  { text: 'Estadísticas avanzadas', ok: true },
                ].map(f => (
                  <li key={f.text} className="text-xs flex items-center gap-2 text-white/65">
                    <span className="text-emerald-400 font-black flex-shrink-0">✓</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-5 block text-center text-xs font-black py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all duration-200 group-hover:border-amber-400/50 group-hover:bg-amber-400/10 group-hover:text-amber-200">
                Activar Premium
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── CATEGORY CAROUSEL ── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="flex items-center">

          {/* "Todos" siempre fijo */}
          <div className="flex-shrink-0 px-3 border-r border-gray-100 py-3">
            <button
              onClick={() => setCategory('TODOS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                category === 'TODOS'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>✨</span> Todos
            </button>
          </div>

          {/* Flecha izquierda */}
          <button
            onClick={() => scrollCarousel('left')}
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            className="flex-shrink-0 p-2 mx-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Carrusel con scroll JS */}
          <div
            ref={carouselRef}
            className="flex-1 overflow-x-hidden flex gap-0 py-3 scrollbar-hide focus:outline-none"
            tabIndex={0}
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onFocus={() => setCarouselPaused(true)}
            onBlur={() => setCarouselPaused(false)}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') { e.preventDefault(); scrollCarousel('right'); }
              if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollCarousel('left'); }
            }}
          >
            {[
              ...CATEGORIES.filter(k => k !== 'TODOS'),
              ...CATEGORIES.filter(k => k !== 'TODOS'),
            ].map((key, idx) => {
              const meta = CATEGORY_META[key];
              const active = category === key;
              return (
                <button
                  key={`${key}-${idx}`}
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 px-4 py-2 mx-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Flecha derecha */}
          <button
            onClick={() => scrollCarousel('right')}
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            className="flex-shrink-0 p-2 mx-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>

        {/* Buscador sticky solo en mobile */}
        <div className="sm:hidden border-t border-gray-100 px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar negocios o servicios..."
              className="w-full pl-9 pr-8 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
              🔍
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Sin resultados</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              No encontramos negocios con esa búsqueda. Prueba con otra categoría o limpia los filtros.
            </p>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all mb-12"
            >
              <X className="w-4 h-4" /> Limpiar filtros
            </button>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Categorías populares</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {['BARBERIA','SPA','SALON_BELLEZA','ODONTOLOGIA','GIMNASIO','MASAJES_DOMICILIO','NUTRICIONISTA','NAIL_ART'].map(key => {
                  const m = CATEGORY_META[key];
                  return (
                    <button
                      key={key}
                      onClick={() => { setSearch(''); setCategory(key); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                      <span>{m.emoji}</span> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900">
                {search
                  ? `Resultados para "${search}"`
                  : category === 'TODOS' ? 'Todos los negocios' : CATEGORY_META[category]?.label}
                <span className="text-sm font-normal text-gray-400 ml-2">· {total} disponibles</span>
              </h2>
              {(search || category !== 'TODOS' || city !== 'TODAS' || hasActiveFilters) && (
                <button onClick={clearAll} className="text-xs text-indigo-600 font-semibold hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Ordenamiento rápido */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {[
                { v: 'featured',   label: '⭐ Destacados' },
                { v: 'rating',     label: '🏆 Rating' },
                { v: 'price_asc',  label: '💰 Menor precio' },
                { v: 'price_desc', label: '💎 Mayor precio' },
                { v: 'newest',     label: '🆕 Nuevos' },
                { v: 'popular',    label: '🔥 Populares' },
              ].map(({ v, label }) => (
                <button key={v} onClick={() => { setSortBy(v); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${sortBy === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map(business => {
                const meta = CATEGORY_META[business.category] ?? CATEGORY_META.OTRO;
                return (
                  <Link key={business.id} href={`/businesses/${business.id}`} className="group card-animate">
                    <div className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ${business.featured ? 'border-amber-300 shadow-amber-100 hover:shadow-amber-200' : 'border-gray-100 hover:shadow-indigo-100'}`}>
                      {/* Cover */}
                      <div className={`h-44 relative flex items-center justify-center overflow-hidden ${!business.coverImage ? `bg-gradient-to-br ${meta.gradient}` : 'bg-gray-100'}`}>
                        {business.coverImage ? (
                          <img src={resolveUrl(business.coverImage)} alt={business.name} className="absolute inset-0 w-full h-full object-cover object-center" />
                        ) : (
                          <>
                            <span className="absolute text-white/10 text-[10rem] font-black select-none leading-none">{meta.emoji}</span>
                            <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                              <span className="text-3xl font-black text-white drop-shadow">
                                {business.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </>
                        )}
                        {business.averageRating && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {business.averageRating}
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold bg-black/30 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                            {meta.label}
                          </span>
                          {business.featured && (
                            <span className="text-[11px] font-bold bg-amber-400 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                              ⭐ Destacado
                            </span>
                          )}
                        </div>
                        {business.minPrice != null && (
                          <div className="absolute bottom-3 right-3">
                            <span className="text-[11px] font-bold bg-black/30 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                              Desde S/ {business.minPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {business.name}
                          </h3>
                          {business.description && business.totalReviews > 0 && (
                            <span title="Perfil verificado">
                              <BadgeCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Rating stars */}
                        {business.averageRating ? (
                          <div className="flex items-center gap-2 mb-2">
                            <StarRow rating={business.averageRating} />
                            <span className="text-xs text-gray-400">{business.averageRating} · {business.totalReviews} reseña{business.totalReviews !== 1 ? 's' : ''}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-300 mb-2">Sin reseñas aún</p>
                        )}

                        <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span>{business.city}</span>
                        </div>

                        {business.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{business.description}</p>
                        )}

                        <div className="flex items-center justify-end pt-3 border-t border-gray-50">
                          <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
                            Ver servicios <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Paginación */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const p = pages <= 7 ? i + 1 :
                    page <= 4 ? i + 1 :
                    page >= pages - 3 ? pages - 6 + i :
                    page - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'}`}>
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">¿Cómo funciona?</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Reserva en 3 pasos</h2>
          <p className="text-gray-400 mb-14 max-w-md mx-auto text-sm">Simple, rápido y sin complicaciones.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { step: '01', emoji: '🔍', title: 'Busca', desc: 'Encuentra el servicio que necesitas entre más de 27 categorías disponibles en Lima.' },
              { step: '02', emoji: '📅', title: 'Reserva', desc: 'Elige el horario que te convenga y confirma tu cita en menos de 60 segundos.' },
              { step: '03', emoji: '✨', title: 'Disfruta', desc: 'Recibe el servicio y deja tu reseña para ayudar a otros a elegir mejor.' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-indigo-200">
                    {s.emoji}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-indigo-100 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">{s.step}</span>
                </div>
                <h3 className="font-black text-gray-900 text-xl mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA VENDEDORES ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 py-20">
        <div className="absolute -top-32 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-0 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="text-5xl block mb-5">🚀</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            ¿Tienes un negocio?<br />
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Únete gratis hoy</span>
          </h2>
          <p className="text-white/50 mb-10 max-w-lg mx-auto text-sm leading-relaxed">
            Empieza a recibir reservas online, gestiona tus servicios y haz crecer tu negocio. Sin costos iniciales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 hover:shadow-xl transition-all text-sm">
              Registra tu negocio gratis
            </Link>
            <Link href="/subscription"
              className="text-white/60 hover:text-white transition text-sm font-medium flex items-center gap-1.5">
              Ver planes y precios <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-12 mt-14">
            {[
              { value: 'S/ 0', label: 'Para empezar' },
              { value: '3 min', label: 'Para configurar' },
              { value: '27+', label: 'Categorías' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
