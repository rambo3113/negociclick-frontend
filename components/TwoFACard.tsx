'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, ShieldCheck, Lock, Eye, EyeOff, Copy, Download, AlertTriangle, X, Check } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';

interface TwoFAStatus {
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
}

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

type Step = 'idle' | 'setup' | 'disable';

export default function TwoFACard() {
  const toast = useToast();
  const codeRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [step, setStep] = useState<Step>('idle');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [savedCodes, setSavedCodes] = useState(false);
  const [disablePwd, setDisablePwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/2fa/status')
      .then(r => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  // Auto-focus code input when setup data arrives
  useEffect(() => {
    if (step === 'setup' && setupData) {
      setTimeout(() => codeRef.current?.focus(), 80);
    }
  }, [step, setupData]);

  // Auto-submit at 6 digits
  useEffect(() => {
    if (code.length === 6 && step === 'setup' && savedCodes) {
      handleEnable();
    }
  }, [code]); // eslint-disable-line

  const reset = () => {
    setStep('idle'); setSetupData(null); setCode('');
    setSavedCodes(false); setDisablePwd(''); setError('');
  };

  const handleSetup = async () => {
    setError(''); setLoading(true);
    try {
      const r = await api.post('/auth/2fa/setup');
      setSetupData(r.data);
      setSavedCodes(false); setCode('');
      setStep('setup');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al iniciar configuración 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!setupData || !/^\d{6}$/.test(code)) return;
    setError(''); setLoading(true);
    try {
      await api.post('/auth/2fa/enable', {
        secret: setupData.secret,
        totp: code,
        backupCodes: setupData.backupCodes,
      });
      setStatus({ twoFactorEnabled: true, backupCodesRemaining: setupData.backupCodes.length });
      reset();
      toast.show('2FA activado correctamente', 'success');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Código incorrecto. Intenta de nuevo.');
      setCode('');
      setTimeout(() => codeRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disablePwd) return;
    setError(''); setLoading(true);
    try {
      await api.post('/auth/2fa/disable', { password: disablePwd });
      setStatus({ twoFactorEnabled: false, backupCodesRemaining: 0 });
      reset();
      toast.show('2FA deshabilitado', 'info');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Contraseña incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
    toast.show('Códigos copiados al portapapeles', 'success');
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    const content = [
      'NegociClick — Códigos de respaldo 2FA',
      `Generados: ${new Date().toLocaleDateString('es-PE')}`,
      '',
      ...setupData.backupCodes,
      '',
      'Cada código puede usarse una sola vez.',
      'Guarda este archivo en un lugar seguro y privado.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'negociclick-2fa-backup.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h2 className="font-bold text-gray-900">Verificación en dos pasos (2FA)</h2>
        </div>
        {status?.twoFactorEnabled && step === 'idle' && (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
            <ShieldCheck className="w-3 h-3" /> Activado
          </span>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loadingStatus && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            Cargando estado...
          </div>
        )}

        {/* ── IDLE ── */}
        {!loadingStatus && step === 'idle' && (
          status?.twoFactorEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Tu cuenta está protegida con 2FA</p>
                  <p className="text-xs text-green-600">
                    {status.backupCodesRemaining} código{status.backupCodesRemaining !== 1 ? 's' : ''} de respaldo restante{status.backupCodesRemaining !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setStep('disable'); setError(''); }}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Deshabilitar 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Añade una capa extra de seguridad con Google Authenticator, Authy o Microsoft Authenticator.
              </p>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Shield className="w-4 h-4" />
                }
                Activar 2FA
              </button>
            </div>
          )
        )}

        {/* ── SETUP ── */}
        {step === 'setup' && setupData && (
          <div className="space-y-6">

            {/* Paso 1 — QR */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Paso 1 — Escanea el código QR
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <img
                  src={setupData.qrCode}
                  alt="QR 2FA — escanea con tu autenticador"
                  className="w-40 h-40 rounded-xl border border-gray-200 flex-shrink-0 bg-white"
                />
                <div className="space-y-2 min-w-0">
                  <p className="text-sm text-gray-600">
                    Abre tu app autenticadora y escanea el QR.<br />
                    ¿No puedes escanearlo? Ingresa el código manualmente:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded-lg select-all break-all leading-relaxed">
                      {setupData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(setupData.secret); toast.show('Código copiado', 'success'); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                      title="Copiar código secreto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 2 — Backup codes */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Paso 2 — Guarda tus códigos de respaldo
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Guarda estos códigos en un lugar seguro. Se muestran <strong>una sola vez</strong> y cada uno puede usarse una vez si pierdes tu autenticador.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {setupData.backupCodes.map(c => (
                    <span key={c} className="font-mono text-xs bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-center text-gray-700 tracking-wider">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyBackupCodes}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <Copy className="w-3 h-3" /> Copiar todos
                  </button>
                  <button
                    type="button"
                    onClick={downloadBackupCodes}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
                  >
                    <Download className="w-3 h-3" /> Descargar .txt
                  </button>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1 border-t border-amber-200">
                  <input
                    type="checkbox"
                    checked={savedCodes}
                    onChange={e => { setSavedCodes(e.target.checked); if (e.target.checked) setTimeout(() => codeRef.current?.focus(), 80); }}
                    className="w-4 h-4 rounded border-amber-300 accent-amber-600"
                  />
                  <span className="text-xs text-amber-800 font-semibold">Ya guardé mis códigos de respaldo</span>
                </label>
              </div>
            </div>

            {/* Paso 3 — Confirmar TOTP */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Paso 3 — Confirma con tu autenticador
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Ingresa el código de <strong>6 dígitos</strong> que muestra tu app:
              </p>
              <input
                ref={codeRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                disabled={!savedCodes}
                className="w-36 border border-gray-200 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-widest bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {!savedCodes && (
                <p className="text-xs text-gray-400 mt-1.5">Marca el checkbox del paso 2 para habilitar este campo.</p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={handleEnable}
                disabled={loading || code.length < 6 || !savedCodes}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Check className="w-4 h-4" />
                }
                Activar 2FA
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── DISABLE ── */}
        {step === 'disable' && (
          <div className="space-y-4 max-w-xs">
            <p className="text-sm text-gray-600">
              Ingresa tu contraseña para confirmar que deseas deshabilitar 2FA.
            </p>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={disablePwd}
                onChange={e => setDisablePwd(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDisable(); }}
                placeholder="Tu contraseña actual"
                autoFocus
                className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDisable}
                disabled={loading || !disablePwd}
                className="inline-flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <X className="w-4 h-4" />
                }
                Deshabilitar
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
