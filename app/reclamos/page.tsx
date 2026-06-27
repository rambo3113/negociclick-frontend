'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { AlertTriangle, CheckCircle, FileText, Loader2 } from 'lucide-react';

interface FormState {
  nombre: string; apellido: string;
  tipoDocumento: string; dni: string;
  email: string; telefono: string;
  tipoReclamo: string;
  descripcion: string; pedido: string;
}

const empty: FormState = {
  nombre: '', apellido: '', tipoDocumento: 'DNI', dni: '',
  email: '', telefono: '', tipoReclamo: 'RECLAMO',
  descripcion: '', pedido: '',
};

export default function ReclamosPage() {
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numero, setNumero] = useState('');

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/reclamos', form);
      setNumero(res.data.numero);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el reclamo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  if (numero) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Reclamo registrado</h2>
            <p className="text-gray-500 text-sm mb-5">
              Hemos recibido tu {form.tipoReclamo.toLowerCase()} y enviado una confirmación a <strong>{form.email}</strong>.
            </p>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-6 py-4 mb-6">
              <p className="text-xs text-indigo-500 font-semibold mb-1">Número de expediente</p>
              <p className="text-2xl font-black text-indigo-700">{numero}</p>
            </div>
            <p className="text-gray-400 text-xs mb-6">
              Plazo de respuesta: hasta <strong>30 días hábiles</strong> según normativa INDECOPI.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setNumero(''); setForm(empty); }}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                Presentar otro reclamo
              </button>
              <Link href="/" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition text-center">
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6" />
            <h1 className="text-3xl font-black">Libro de Reclamaciones</h1>
          </div>
          <p className="text-indigo-200 text-sm">
            Conforme a lo establecido en el Código de Protección y Defensa del Consumidor — Ley N° 29571 y la normativa del INDECOPI.
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 py-10 flex-1">

        {/* Aviso legal */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Información importante:</strong> Un <strong>reclamo</strong> es una disconformidad relacionada con los productos o servicios. Una <strong>queja</strong> es la disconformidad relacionada con la atención al usuario. El proveedor dispone de <strong>30 días hábiles</strong> para dar respuesta según la normativa INDECOPI.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tipo de reclamo */}
            <div>
              <p className={labelClass}>Tipo de registro <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 gap-3">
                {(['RECLAMO', 'QUEJA'] as const).map(tipo => (
                  <label key={tipo}
                    className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition ${form.tipoReclamo === tipo ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="tipoReclamo" value={tipo}
                      checked={form.tipoReclamo === tipo}
                      onChange={set('tipoReclamo')} className="accent-indigo-600" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{tipo === 'RECLAMO' ? 'Reclamo' : 'Queja'}</p>
                      <p className="text-xs text-gray-400">{tipo === 'RECLAMO' ? 'Disconformidad con el servicio' : 'Disconformidad con la atención'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Datos personales */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Datos del consumidor</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
                  <input required value={form.nombre} onChange={set('nombre')} placeholder="Juan" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Apellido <span className="text-red-500">*</span></label>
                  <input required value={form.apellido} onChange={set('apellido')} placeholder="Pérez" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tipo de documento</label>
                  <select value={form.tipoDocumento} onChange={set('tipoDocumento')} className={inputClass}>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>N° de documento <span className="text-red-500">*</span></label>
                  <input required value={form.dni} onChange={set('dni')} placeholder="12345678" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Correo electrónico <span className="text-red-500">*</span></label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="999 999 999" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Detalle del reclamo */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Detalle del {form.tipoReclamo.toLowerCase()}</p>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    Descripción del {form.tipoReclamo.toLowerCase()} <span className="text-red-500">*</span>
                  </label>
                  <textarea required rows={4} value={form.descripcion} onChange={set('descripcion')}
                    placeholder={`Describe detalladamente tu ${form.tipoReclamo.toLowerCase()}...`}
                    className={inputClass + ' resize-none'} />
                  <p className="text-xs text-gray-400 mt-1">{form.descripcion.length}/1000 caracteres</p>
                </div>
                <div>
                  <label className={labelClass}>Pedido o solución esperada</label>
                  <textarea rows={3} value={form.pedido} onChange={set('pedido')}
                    placeholder="¿Qué solución esperas de NegociClick? (opcional)"
                    className={inputClass + ' resize-none'} />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-4">
                Al enviar este formulario, autorizo el tratamiento de mis datos personales conforme a la Ley N° 29733 — Ley de Protección de Datos Personales del Perú.
              </p>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : 'Registrar mi reclamo'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Necesitas ayuda adicional?{' '}
          <Link href="/contacto" className="text-indigo-600 font-semibold hover:underline">Contáctanos</Link>
          {' '}o visita{' '}
          <a href="https://www.indecopi.gob.pe" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline">INDECOPI</a>
        </p>
      </main>

      <Footer />
    </div>
  );
}
