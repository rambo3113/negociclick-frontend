'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Star } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  category?: string;
  city?: string;
  ownerEmail?: string;
}

const FEATURED_PLANS = {
  '7days': { label: '7 días', icon: '⭐', daysCount: 7, price: 9.90 },
  '15days': { label: '15 días', icon: '⭐⭐', daysCount: 15, price: 19.90 },
  '30days': { label: '30 días', icon: '⭐⭐⭐', daysCount: 30, price: 29.90 },
};

export default function AdminFeaturedPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bizSearch, setBizSearch] = useState('');
  const [bizResults, setBizResults] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [featuredPlan, setFeaturedPlan] = useState<'7days' | '15days' | '30days'>('30days');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Search businesses
  useEffect(() => {
    if (bizSearch.length < 2) {
      setBizResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api.get('/businesses', { params: { search: bizSearch, limit: 5 } })
        .then(res => setBizResults(res.data.businesses || []))
        .catch(() => setBizResults([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [bizSearch]);

  const handleAssignFeatured = async () => {
    if (!selectedBiz || !selectedBiz.id) {
      setMsg('❌ Selecciona un negocio');
      return;
    }

    setLoading(true);
    setMsg('');

    try {
      const planMeta = FEATURED_PLANS[featuredPlan];
      const daysInMs = planMeta.daysCount * 24 * 60 * 60 * 1000;
      const featuredUntil = new Date(Date.now() + daysInMs).toISOString();

      const res = await api.post('/admin/featured', {
        businessId: selectedBiz.id,
        period: featuredPlan,
        days: planMeta.daysCount,
        amount: planMeta.price,
        featuredUntil,
        reason: reason || undefined,
      });

      if (res.data.success) {
        setMsg(`✅ Plan de ${planMeta.label} asignado a ${selectedBiz.name} hasta ${new Date(featuredUntil).toLocaleDateString('es-PE')}`);
        setSelectedBiz(null);
        setBizSearch('');
        setBizResults([]);
        setReason('');
        setFeaturedPlan('30days');
      }
    } catch (err: any) {
      setMsg(`❌ ${err.response?.data?.error || 'Error al asignar plan'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
            <h1 className="text-3xl font-black text-gray-900">Planes Destacados</h1>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-900">
              Asigna planes de destacado manualmente a negocios. El negocio aparecerá en la posición premium hasta la fecha especificada.
            </p>
          </div>

          {/* Business search */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">Negocio</label>
            {selectedBiz && selectedBiz.id ? (
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex-1">
                  <div className="text-sm font-bold text-amber-900">{selectedBiz.name}</div>
                  {selectedBiz.category && <div className="text-xs text-amber-600">{selectedBiz.category}</div>}
                </div>
                <button 
                  onClick={() => { setSelectedBiz(null); setBizSearch(''); setBizResults([]); }}
                  className="ml-3 flex-shrink-0 text-amber-500 hover:text-amber-700 hover:bg-amber-200 rounded-full w-6 h-6 flex items-center justify-center font-bold transition-all"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={bizSearch}
                  onChange={e => setBizSearch(e.target.value)}
                  placeholder="Buscar negocio por nombre..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                {bizSearch.length > 0 && bizResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
                    No se encontraron negocios
                  </div>
                )}
                {bizResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-amber-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {bizResults.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBiz(b); setBizSearch(''); setBizResults([]); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-amber-50 border-b border-gray-100 last:border-0 transition-colors font-medium"
                      >
                        <div className="font-semibold">{b.name}</div>
                        <div className="text-xs text-gray-500">
                          {b.category && `${b.category} • `}
                          {b.city || 'Lima'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Featured Plan Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">Plan de Destacado</label>
            <div className="grid grid-cols-3 gap-3">
              {(['7days', '15days', '30days'] as const).map(plan => (
                <button
                  key={plan}
                  onClick={() => setFeaturedPlan(plan)}
                  className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                    featuredPlan === plan
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                      : 'border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xl mb-1">{FEATURED_PLANS[plan].icon}</div>
                  <div className="text-xs font-bold">{FEATURED_PLANS[plan].label}</div>
                  <div className="text-xs text-amber-600 mt-1">S/ {FEATURED_PLANS[plan].price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Razón <span className="text-gray-500">(opcional)</span></label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="ej: promotion, acquisition, vip_partner"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Message */}
          {msg && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
              msg.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {msg}
            </div>
          )}

          {/* Submit Button */}
          <button
            disabled={!selectedBiz || loading}
            onClick={handleAssignFeatured}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-base hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? '⏳ Asignando...' : '⭐ Asignar Plan Destacado'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white/10 backdrop-blur rounded-lg p-6 border border-white/20">
          <h3 className="text-white font-bold mb-3">📋 Planes Disponibles</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• <strong>7 días:</strong> Aparece en destacados por una semana - S/ 9.90</p>
            <p>• <strong>15 días:</strong> Aparece en destacados por quince días - S/ 19.90</p>
            <p>• <strong>30 días:</strong> Aparece en destacados por un mes - S/ 29.90</p>
          </div>
        </div>
      </div>
    </div>
  );
}
