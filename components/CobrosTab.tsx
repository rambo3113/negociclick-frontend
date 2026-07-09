'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  CreditCard, ShieldCheck, KeyRound, CheckCircle2,
  AlertTriangle, Loader2, Trash2, Save, Crown, Zap,
} from 'lucide-react';
import Link from 'next/link';

interface PaymentConfig {
  publicKey: string | null;
  secretKeyMasked: string | null;
  validatedAt: string | null;
  onlinePaymentEnabled: boolean;
  paymentInstructions: string | null;
}

interface Props {
  bizId: string;
  plan: string;
}

export default function CobrosTab({ bizId, plan }: Props) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Keys form
  const [pkInput, setPkInput] = useState('');
  const [skInput, setSkInput] = useState('');
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [keysSuccess, setKeysSuccess] = useState('');

  // Instructions form
  const [instructions, setInstructions] = useState('');
  const [instrLoading, setInstrLoading] = useState(false);
  const [instrSaved, setInstrSaved] = useState(false);

  useEffect(() => {
    if (plan !== 'PREMIUM') return;
    setLoading(true);
    api.get(`/businesses/${bizId}/payment-config`)
      .then(r => {
        setConfig(r.data.config);
        setInstructions(r.data.config.paymentInstructions ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bizId, plan]);

  // For PRO: just load paymentInstructions from business profile
  useEffect(() => {
    if (plan !== 'PRO') return;
    api.get(`/businesses/${bizId}`)
      .then(r => setInstructions(r.data.business.paymentInstructions ?? ''))
      .catch(() => {});
  }, [bizId, plan]);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysError('');
    setKeysSuccess('');
    setKeysLoading(true);
    try {
      await api.put(`/businesses/${bizId}/payment-config`, {
        publicKey: pkInput.trim(),
        secretKey: skInput.trim(),
      });
      const r = await api.get(`/businesses/${bizId}/payment-config`);
      setConfig(r.data.config);
      setPkInput('');
      setSkInput('');
      setKeysSuccess('Llaves configuradas. Tus clientes ya pueden pagar con tarjeta.');
    } catch (err: any) {
      setKeysError(err.response?.data?.error ?? 'Error al guardar las llaves');
    } finally {
      setKeysLoading(false);
    }
  };

  const handleDeleteKeys = async () => {
    if (!confirm('¿Quitar las llaves de Culqi? El negocio volverá a pago directo.')) return;
    setKeysLoading(true);
    setKeysError('');
    setKeysSuccess('');
    try {
      await api.delete(`/businesses/${bizId}/payment-config`);
      setConfig(prev => prev ? { ...prev, publicKey: null, secretKeyMasked: null, validatedAt: null, onlinePaymentEnabled: false } : null);
      setKeysSuccess('Llaves eliminadas. El negocio vuelve a pago directo.');
    } catch (err: any) {
      setKeysError(err.response?.data?.error ?? 'Error al eliminar las llaves');
    } finally {
      setKeysLoading(false);
    }
  };

  const handleSaveInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstrLoading(true);
    setInstrSaved(false);
    try {
      await api.put(`/businesses/${bizId}/payment-instructions`, { paymentInstructions: instructions });
      setInstrSaved(true);
      setTimeout(() => setInstrSaved(false), 3000);
    } catch {
      // silently ignore
    } finally {
      setInstrLoading(false);
    }
  };

  if (plan === 'FREE') {
    return (
      <div className="p-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Recibe pagos en línea</h3>
          <p className="text-sm text-gray-500 mb-6">
            Con el plan PRO tus clientes pueden pagar al confirmar su reserva. Con PREMIUM,
            configura tus propias llaves de Culqi y recibe el pago directamente en tu cuenta.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition"
          >
            <Zap className="w-4 h-4" /> Ver planes
          </Link>
        </div>
      </div>
    );
  }

  const InstructionsForm = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Save className="w-4 h-4 text-gray-400" /> Instrucciones de pago directo
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Se muestra al cliente después de crear su reserva (Yape, transferencia, contra entrega, etc.)
      </p>
      <form onSubmit={handleSaveInstructions} className="space-y-3">
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={4}
          placeholder="Ej: Pagar por Yape al 987-654-321 antes de confirmar el pedido."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={instrLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-60"
          >
            {instrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar instrucciones
          </button>
          {instrSaved && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  );

  if (plan === 'PRO') {
    return (
      <div className="p-6 space-y-5">
        <InstructionsForm />
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-start">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm mb-1">Pago en línea con PREMIUM</p>
            <p className="text-xs text-gray-500 mb-3">
              Conecta tus llaves de Culqi y tus clientes pagarán con tarjeta al reservar.
              El dinero llega directo a tu cuenta — sin intermediarios.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              <Crown className="w-3.5 h-3.5" /> Subir a PREMIUM
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PREMIUM
  return (
    <div className="p-6 space-y-5">
      {/* Keys status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" /> Llaves de Culqi
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Tus clientes pagan directo a tu cuenta de Culqi. Obtén tus llaves en{' '}
          <a href="https://dashboard.culqi.com/developers/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
            dashboard.culqi.com
          </a>
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : config?.onlinePaymentEnabled ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-green-700 mb-1">
                <ShieldCheck className="w-4 h-4" /> Pago en línea activo
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Llave pública</span>
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 font-mono">{config.publicKey}</code>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Llave secreta</span>
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 font-mono">{config.secretKeyMasked}</code>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Validado</span>
                <span>{config.validatedAt ? new Date(config.validatedAt).toLocaleDateString('es-PE') : '—'}</span>
              </div>
            </div>
            {keysError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{keysError}</div>
            )}
            {keysSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {keysSuccess}
              </div>
            )}
            <button
              onClick={handleDeleteKeys}
              disabled={keysLoading}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-semibold border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {keysLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Quitar llaves de Culqi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveKeys} className="space-y-3">
            {config && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-1">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Sin llaves configuradas — el negocio usa pago directo
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Llave pública (pk_live_* o pk_test_*)</label>
              <input
                type="text"
                value={pkInput}
                onChange={e => setPkInput(e.target.value)}
                placeholder="pk_live_..."
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Llave secreta (sk_live_* o sk_test_*)</label>
              <input
                type="password"
                value={skInput}
                onChange={e => setSkInput(e.target.value)}
                placeholder="sk_live_..."
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {keysError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{keysError}</div>
            )}
            {keysSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {keysSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={keysLoading || !pkInput || !skInput}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {keysLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {keysLoading ? 'Validando con Culqi...' : 'Validar y guardar llaves'}
            </button>
            <p className="text-xs text-gray-400">Las llaves se validarán contra la API de Culqi antes de guardarse.</p>
          </form>
        )}
      </div>

      <InstructionsForm />
    </div>
  );
}
