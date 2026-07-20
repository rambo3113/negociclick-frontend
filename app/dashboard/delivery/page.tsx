'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save, Truck } from 'lucide-react';
import Navbar from '@/components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface DeliveryConfig {
  id: string;
  businessId: string;
  pickupEnabled: boolean;
  ownDeliveryEnabled: boolean;
  ownDeliveryPrice: number | null;
  ownDeliveryTimeMin: number | null;
  ownDeliveryTimeMax: number | null;
  ownDeliveryNote: string | null;
  rappiEnabled: boolean;
  rappiLink: string | null;
  boltEnabled: boolean;
  boltLink: string | null;
  glovoEnabled: boolean;
  glovoLink: string | null;
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

export default function DeliveryPage() {
  const [config, setConfig]       = useState<DeliveryConfig | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API}/businesses/my`, { headers: authHeaders() });
        const data = await res.json();
        const biz  = data.businesses?.[0];
        if (!biz?.id) { setError('No tienes negocios registrados'); setLoading(false); return; }
        setBusinessId(biz.id);

        const cfgRes  = await fetch(`${API}/businesses/${biz.id}/delivery-methods`, { headers: authHeaders() });
        const cfgData = await cfgRes.json();
        setConfig(cfgData.config);
      } catch {
        setError('Error cargando configuración');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  function toggle(field: keyof DeliveryConfig) {
    if (!config) return;
    setConfig({ ...config, [field]: !config[field] });
  }

  function set(field: keyof DeliveryConfig, value: unknown) {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/businesses/${businessId}/delivery-methods`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
      setConfig(data.config);
      setSuccess('Configuración guardada');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </>
    );
  }

  if (!config) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-700">{error || 'Error cargando configuración'}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Truck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración de Entregas</h1>
              <p className="text-sm text-gray-500">Elige cómo tus clientes reciben sus pedidos</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">

              {/* ── PICKUP ────────────────────────────────────────────── */}
              <Section
                emoji="🏪" title="Retiro en el negocio"
                subtitle="El cliente recoge su pedido en tu local — Gratis"
                enabled={config.pickupEnabled}
                onToggle={() => toggle('pickupEnabled')}
              />

              {/* ── ENTREGAS PROPIAS ───────────────────────────────────── */}
              <Section
                emoji="🚚" title="Entregas propias"
                subtitle="Tu equipo hace la entrega — sin comisión de NegociClick"
                enabled={config.ownDeliveryEnabled}
                onToggle={() => toggle('ownDeliveryEnabled')}
              >
                {config.ownDeliveryEnabled && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="label">Precio de entrega (S/)</label>
                      <input
                        type="number" step="0.50" min="0"
                        value={config.ownDeliveryPrice ?? ''}
                        onChange={e => set('ownDeliveryPrice', e.target.value ? parseFloat(e.target.value) : null)}
                        className="input" placeholder="6.00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Tiempo mínimo (min)</label>
                        <input type="number" min="1"
                          value={config.ownDeliveryTimeMin ?? ''}
                          onChange={e => set('ownDeliveryTimeMin', e.target.value ? parseInt(e.target.value) : null)}
                          className="input" placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="label">Tiempo máximo (min)</label>
                        <input type="number" min="1"
                          value={config.ownDeliveryTimeMax ?? ''}
                          onChange={e => set('ownDeliveryTimeMax', e.target.value ? parseInt(e.target.value) : null)}
                          className="input" placeholder="60"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Nota para el cliente (opcional)</label>
                      <input type="text"
                        value={config.ownDeliveryNote ?? ''}
                        onChange={e => set('ownDeliveryNote', e.target.value)}
                        className="input" placeholder="ej: Entregas por nuestro equipo"
                      />
                    </div>
                  </div>
                )}
              </Section>

              {/* ── RAPPI ─────────────────────────────────────────────── */}
              <Section
                emoji="🍔" title="Rappi"
                subtitle="Los clientes coordinan por Rappi"
                enabled={config.rappiEnabled}
                onToggle={() => toggle('rappiEnabled')}
              >
                {config.rappiEnabled && (
                  <div className="mt-4">
                    <label className="label">Link a tu perfil en Rappi (opcional)</label>
                    <input type="url"
                      value={config.rappiLink ?? ''}
                      onChange={e => set('rappiLink', e.target.value)}
                      className="input" placeholder="https://rappi.com.pe/..."
                    />
                  </div>
                )}
              </Section>

              {/* ── BOLT ──────────────────────────────────────────────── */}
              <Section
                emoji="⚡" title="Bolt Food"
                subtitle="Los clientes coordinan por Bolt Food"
                enabled={config.boltEnabled}
                onToggle={() => toggle('boltEnabled')}
              >
                {config.boltEnabled && (
                  <div className="mt-4">
                    <label className="label">Link a tu perfil en Bolt (opcional)</label>
                    <input type="url"
                      value={config.boltLink ?? ''}
                      onChange={e => set('boltLink', e.target.value)}
                      className="input" placeholder="https://bolt.eu/..."
                    />
                  </div>
                )}
              </Section>

              {/* ── GLOVO ─────────────────────────────────────────────── */}
              <Section
                emoji="📦" title="Glovo"
                subtitle="Los clientes coordinan por Glovo"
                enabled={config.glovoEnabled}
                onToggle={() => toggle('glovoEnabled')}
              >
                {config.glovoEnabled && (
                  <div className="mt-4">
                    <label className="label">Link a tu perfil en Glovo (opcional)</label>
                    <input type="url"
                      value={config.glovoLink ?? ''}
                      onChange={e => set('glovoLink', e.target.value)}
                      className="input" placeholder="https://glovo.com/..."
                    />
                  </div>
                )}
              </Section>

              {/* ── WHATSAPP ──────────────────────────────────────────── */}
              <Section
                emoji="💬" title="Coordinar por WhatsApp"
                subtitle="El cliente te escribe para coordinar la entrega"
                enabled={config.whatsappEnabled}
                onToggle={() => toggle('whatsappEnabled')}
              >
                {config.whatsappEnabled && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="label">Número de WhatsApp <span className="text-red-500">*</span></label>
                      <input type="tel"
                        value={config.whatsappNumber ?? ''}
                        onChange={e => set('whatsappNumber', e.target.value)}
                        className="input" placeholder="+51 987654321"
                      />
                    </div>
                    <div>
                      <label className="label">Mensaje personalizado (opcional)</label>
                      <textarea
                        value={config.whatsappMessage ?? ''}
                        onChange={e => set('whatsappMessage', e.target.value)}
                        className="input resize-none" rows={3}
                        placeholder="ej: Hola, quiero coordinar mi pedido"
                      />
                    </div>
                  </div>
                )}
              </Section>
            </div>

            {/* Guardar */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">Los cambios se aplican inmediatamente</p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold text-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-blue-900 mb-3">Vista del cliente</p>
            <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-2 text-sm text-gray-700">
              {config.pickupEnabled && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-indigo-500 flex-shrink-0" />
                  <span>🏪 Retiro en el negocio — <strong>Gratis</strong></span>
                </div>
              )}
              {config.ownDeliveryEnabled && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-indigo-500 flex-shrink-0" />
                  <span>
                    🚚 Delivery propio — <strong>S/ {config.ownDeliveryPrice?.toFixed(2) ?? '0.00'}</strong>
                    {config.ownDeliveryTimeMin && config.ownDeliveryTimeMax && (
                      <span className="text-gray-500"> · {config.ownDeliveryTimeMin}–{config.ownDeliveryTimeMax} min</span>
                    )}
                  </span>
                </div>
              )}
              {config.rappiEnabled   && <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-indigo-500 flex-shrink-0" /><span>🍔 Rappi{config.rappiLink ? ' · Ver tienda' : ''}</span></div>}
              {config.boltEnabled    && <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-indigo-500 flex-shrink-0" /><span>⚡ Bolt Food{config.boltLink ? ' · Ver tienda' : ''}</span></div>}
              {config.glovoEnabled   && <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-indigo-500 flex-shrink-0" /><span>📦 Glovo{config.glovoLink ? ' · Ver tienda' : ''}</span></div>}
              {config.whatsappEnabled && <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-indigo-500 flex-shrink-0" /><span>💬 WhatsApp — {config.whatsappNumber}</span></div>}
              {!config.pickupEnabled && !config.ownDeliveryEnabled && !config.rappiEnabled && !config.boltEnabled && !config.glovoEnabled && !config.whatsappEnabled && (
                <p className="text-gray-400 italic">Ningún método habilitado</p>
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .label { display: block; font-size: 0.8125rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
        .input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
      `}</style>
    </>
  );
}

function Section({
  emoji, title, subtitle, enabled, onToggle, children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={`px-6 py-5 transition-colors ${enabled ? 'bg-white' : 'bg-gray-50/60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            {emoji} {title}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            enabled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>
      {children}
    </div>
  );
}
