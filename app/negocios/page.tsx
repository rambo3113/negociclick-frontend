'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Search, Star, MapPin, SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  description?: string;
  coverImage?: string;
  averageRating?: number | null;
  totalReviews?: number;
  minPrice?: number | null;
  featured?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const UPLOADS_BASE = API_BASE.replace('/api', '');
const resolveUrl = (path?: string | null) =>
  !path ? '' : path.startsWith('http') ? path : `${UPLOADS_BASE}${path}`;

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'BARBERIA', label: 'Barbería' },
  { value: 'SPA', label: 'Spa' },
  { value: 'SALON_BELLEZA', label: 'Salón de Belleza' },
  { value: 'VETERINARIA', label: 'Veterinaria' },
  { value: 'REPOSTERIA', label: 'Repostería' },
  { value: 'ODONTOLOGIA', label: 'Odontología' },
  { value: 'GIMNASIO', label: 'Gimnasio' },
  { value: 'TATUAJES', label: 'Tatuajes & Piercing' },
  { value: 'PSICOLOGO', label: 'Psicólogo' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'PELUQUERIA_CANINA', label: 'Peluquería Canina' },
  { value: 'FISIOTERAPIA', label: 'Fisioterapia' },
  { value: 'MICROPIGMENTACION', label: 'Micropigmentación' },
  { value: 'CLASES_PARTICULARES', label: 'Clases Particulares' },
  { value: 'LIMPIEZA_HOGAR', label: 'Limpieza del Hogar' },
  { value: 'MAQUILLAJE', label: 'Maquillaje' },
  { value: 'CATERING', label: 'Catering / Chef' },
  { value: 'GASFITERIA', label: 'Gasfitería' },
  { value: 'CARPINTERIA', label: 'Carpintería' },
  { value: 'JARDINERIA', label: 'Jardinería' },
  { value: 'ELECTRICIDAD', label: 'Electricidad' },
  { value: 'MASAJES_DOMICILIO', label: 'Masajes a Domicilio' },
  { value: 'NAIL_ART', label: 'Uñas / Nail Art' },
  { value: 'FLORES', label: 'Flores' },
  { value: 'OTRO', label: 'Otro' },
];

const PRICE_RANGES = [
  { label: 'Cualquier precio', min: '', max: '' },
  { label: 'Hasta S/ 50',      min: '',   max: '50' },
  { label: 'S/ 50 – S/ 100',   min: '50', max: '100' },
  { label: 'S/ 100 – S/ 200',  min: '100',max: '200' },
  { label: 'S/ 200+',          min: '200',max: '' },
];

const RATING_OPTIONS = [
  { label: 'Cualquier calificación', value: '' },
  { label: '4+ estrellas',           value: '4' },
  { label: '3+ estrellas',           value: '3' },
  { label: '2+ estrellas',           value: '2' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Destacados primero' },
  { value: 'rating',   label: 'Mejor calificados' },
  { value: 'newest',   label: 'Más recientes' },
  { value: 'popular',  label: 'Más populares' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];

// ─── Star row helper ─────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

// ─── Business card ───────────────────────────────────────────────────────────

function BusinessCard({ biz }: { biz: Business }) {
  return (
    <Link href={`/businesses/${biz.id}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all overflow-hidden flex flex-col">
      {/* Cover image or gradient placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-400 to-purple-500 overflow-hidden flex-shrink-0">
        {biz.coverImage ? (
          <img
            src={resolveUrl(biz.coverImage)}
            alt={biz.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <span className="text-7xl">{getCategoryEmoji(biz.category)}</span>
          </div>
        )}
        {biz.featured && (
          <span className="absolute top-2.5 left-2.5 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
            ⭐ Destacado
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide mb-1">
          {getCategoryLabel(biz.category)}
        </p>
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 group-hover:text-indigo-700 transition-colors">
          {biz.name}
        </h3>
        {biz.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{biz.description}</p>
        )}
        <div className="mt-auto space-y-1.5">
          {biz.averageRating ? (
            <div className="flex items-center gap-1.5">
              <StarRow rating={biz.averageRating} />
              <span className="text-xs text-gray-500">{biz.averageRating} ({biz.totalReviews})</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />{biz.city}
            </span>
            {biz.minPrice != null && (
              <span className="text-xs font-bold text-indigo-600">
                Desde S/ {Number(biz.minPrice).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    BARBERIA: '✂️', SPA: '🌿', SALON_BELLEZA: '💅', VETERINARIA: '🐾',
    REPOSTERIA: '🎂', ODONTOLOGIA: '🦷', GIMNASIO: '🏋️', TATUAJES: '🎨',
    PSICOLOGO: '🧠', NUTRICIONISTA: '🥗', PELUQUERIA_CANINA: '🐕',
    FISIOTERAPIA: '🦺', CLASES_PARTICULARES: '📚', LIMPIEZA_HOGAR: '🧹',
    MAQUILLAJE: '💄', CATERING: '🍽️', GASFITERIA: '🔧', CARPINTERIA: '🪚',
    JARDINERIA: '🌱', ELECTRICIDAD: '⚡', MASAJES_DOMICILIO: '💆',
    NAIL_ART: '💅', FLORES: '🌸', OTRO: '🏪',
  };
  return map[cat] ?? '🏪';
}

function getCategoryLabel(cat: string): string {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function NegociosPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [priceIdx, setPriceIdx] = useState(0);
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBusinesses = useCallback(async (overrides: Record<string, string | number> = {}) => {
    setLoading(true);
    const pr = PRICE_RANGES[priceIdx];
    try {
      const params = new URLSearchParams();
      const s = String(overrides.search ?? search).trim();
      const cat = String(overrides.category ?? category);
      const c = String(overrides.city ?? city).trim();
      const mn = String(overrides.minRating ?? minRating);
      const sort = String(overrides.sortBy ?? sortBy);
      const p = Number(overrides.page ?? page);
      const minP = String(overrides.minPrice ?? pr.min);
      const maxP = String(overrides.maxPrice ?? pr.max);

      if (s)    params.set('search', s);
      if (cat)  params.set('category', cat);
      if (c)    params.set('city', c);
      if (mn)   params.set('minRating', mn);
      if (sort) params.set('sortBy', sort);
      if (minP) params.set('minPrice', minP);
      if (maxP) params.set('maxPrice', maxP);
      params.set('page', String(p));
      params.set('limit', '18');

      const res = await api.get(`/businesses?${params.toString()}`);
      setBusinesses(res.data.businesses ?? []);
      setTotal(res.data.total ?? 0);
      setPages(res.data.pages ?? 1);
    } catch {
      // keep existing results
    } finally {
      setLoading(false);
    }
  }, [search, category, city, priceIdx, minRating, sortBy, page]);

  // Initial load
  useEffect(() => { fetchBusinesses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = (overrides: Record<string, string | number> = {}) => {
    const newPage = 1;
    setPage(newPage);
    fetchBusinesses({ ...overrides, page: newPage });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => applyFilters({ search: val }), 400);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    applyFilters({ category: val });
  };

  const handleRatingChange = (val: string) => {
    setMinRating(val);
    applyFilters({ minRating: val });
  };

  const handlePriceChange = (idx: number) => {
    setPriceIdx(idx);
    const pr = PRICE_RANGES[idx];
    applyFilters({ minPrice: pr.min, maxPrice: pr.max });
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    applyFilters({ sortBy: val });
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => applyFilters({ city: val }), 400);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchBusinesses({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setCity('');
    setPriceIdx(0); setMinRating(''); setSortBy('featured'); setPage(1);
    fetchBusinesses({ search: '', category: '', city: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'featured', page: 1 });
  };

  const hasActiveFilters = !!(search || category || city || priceIdx > 0 || minRating);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-black mb-1">Explorar negocios</h1>
          <p className="text-white/70 text-sm mb-6">Encuentra servicios cerca de ti</p>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Buscar negocio o servicio…"
              className="w-full bg-white text-gray-900 rounded-xl pl-11 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar Filters (desktop) / Collapsible (mobile) ── */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Mobile toggle */}
            <button
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm mb-3"
              onClick={() => setFiltersOpen(o => !o)}
            >
              <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Filtros{hasActiveFilters && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block space-y-4`}>

              {/* Category */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Categoría</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => handleCategoryChange(c.value)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        category === c.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ciudad</p>
                <input
                  type="text"
                  value={city}
                  onChange={e => handleCityChange(e.target.value)}
                  placeholder="Ej: Lima, Cusco…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Price range */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Precio</p>
                <div className="space-y-1">
                  {PRICE_RANGES.map((pr, i) => (
                    <button
                      key={i}
                      onClick={() => handlePriceChange(i)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        priceIdx === i ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Calificación mínima</p>
                <div className="space-y-1">
                  {RATING_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => handleRatingChange(r.value)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        minRating === r.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {r.value ? (
                        <span className="flex items-center gap-1.5">
                          <StarRow rating={Number(r.value)} /> {r.label}
                        </span>
                      ) : r.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold py-2 transition">
                  <X className="w-4 h-4" /> Limpiar filtros
                </button>
              )}
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Sort + count bar */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                {loading ? 'Buscando…' : (
                  <span><strong className="text-gray-900">{total}</strong> negocio{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</span>
                )}
              </p>
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
              >
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 font-medium">No encontramos negocios con esos filtros.</p>
                <p className="text-gray-400 text-sm mt-1">Intenta cambiar la categoría o el texto de búsqueda.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 text-sm text-indigo-600 font-semibold hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {businesses.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
                      ← Anterior
                    </button>
                    {Array.from({ length: pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
                      .reduce<(number | '…')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - Number(arr[i - 1]) > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '…' ? (
                          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                        ) : (
                          <button key={p} onClick={() => handlePage(Number(p))}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                              page === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}>
                            {p}
                          </button>
                        )
                      )}
                    <button onClick={() => handlePage(page + 1)} disabled={page >= pages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
