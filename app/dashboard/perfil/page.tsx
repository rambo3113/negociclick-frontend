'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { ChevronLeft, Upload, Save, Loader2, Image as ImageIcon, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const UPLOADS_BASE = API_BASE.replace('/api', '');
const resolveUrl = (p?: string | null) =>
  !p ? '' : p.startsWith('http') ? p : `${UPLOADS_BASE}${p}`;

interface Business {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  slogan?: string | null;
  heroBannerImageUrl?: string | null;
  coverImage?: string | null;
}

export default function DashboardPerfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [description, setDescription] = useState('');
  const [slogan, setSlogan] = useState('');
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/businesses/my')
      .then(res => {
        const biz: Business = res.data.businesses?.[0];
        if (!biz) return;
        setBusiness(biz);
        setDescription(biz.description ?? '');
        setSlogan(biz.slogan ?? '');
        setHeroBannerUrl(biz.heroBannerImageUrl ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.show('La imagen no puede superar 5 MB', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.show('Solo se aceptan JPG, PNG o WebP', 'error');
      return;
    }
    setHeroFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadHero = async () => {
    if (!heroFile || !business) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('hero', heroFile);
      const res = await api.post(`/businesses/${business.id}/hero`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setHeroBannerUrl(res.data.heroBannerImageUrl);
      setHeroFile(null);
      setPreviewUrl(null);
      toast.show('Foto de portada actualizada', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al subir la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!business) return;
    if (description.length > 500) {
      toast.show('La descripción no puede superar 500 caracteres', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/businesses/${business.id}/profile`, { description, slogan });
      toast.show('Perfil actualizado', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-gray-500">Primero crea un negocio para personalizar tu portada.</p>
          <Link href="/dashboard" className="text-indigo-600 font-semibold hover:underline">
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const heroToShow = previewUrl ?? resolveUrl(heroBannerUrl);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Volver al dashboard
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mb-1">Portada del negocio</h1>
        <p className="text-sm text-gray-400 mb-8">
          Personaliza cómo los clientes ven tu página — {business.name}
        </p>

        {/* ── Hero Banner ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Foto de portada</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Imagen de fondo principal de tu negocio (1200 × 300 recomendado). JPG, PNG o WebP, máx 5 MB.
            </p>
          </div>

          {/* Preview */}
          <div
            className="relative w-full bg-gradient-to-br from-indigo-500 to-purple-600"
            style={{ height: 180 }}
          >
            {heroToShow && (
              <img
                src={heroToShow}
                alt="Hero banner"
                className="w-full h-full object-cover"
              />
            )}
            {!heroToShow && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <ImageIcon className="w-16 h-16 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-3 left-4 text-white">
              <p className="text-lg font-black drop-shadow">{business.name}</p>
              <p className="text-xs text-white/70">Vista previa del hero</p>
            </div>
            {previewUrl && (
              <button
                onClick={() => { setPreviewUrl(null); setHeroFile(null); }}
                className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 rounded-full p-1 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="px-6 py-4 flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Upload className="w-4 h-4" />
              {heroBannerUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
            </button>
            {heroFile && (
              <button
                onClick={handleUploadHero}
                disabled={uploading}
                className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {uploading ? 'Subiendo…' : 'Guardar foto'}
              </button>
            )}
          </div>
        </div>

        {/* ── Descripción y Slogan ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="font-bold text-gray-900 text-sm mb-4">Texto del negocio</h2>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Slogan / tagline
            </label>
            <input
              type="text"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              maxLength={100}
              placeholder="Ej: Tu mejor opción en Lima Norte"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{slogan.length}/100</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Descripción breve
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Cuéntales a tus clientes qué ofreces, tu especialidad, años de experiencia…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className={`text-xs mt-1 text-right ${description.length > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
              {description.length}/500
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs text-indigo-700 font-semibold mb-1">Ver cómo se ve tu página</p>
          <Link
            href={`/businesses/${business.id}`}
            target="_blank"
            className="text-xs text-indigo-500 hover:underline"
          >
            /businesses/{business.id} →
          </Link>
        </div>
      </div>
    </div>
  );
}
