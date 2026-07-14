'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, ChevronDown, ChevronRight, FolderOpen, Loader2, X, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Subcategory {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  position: number;
  _count?: { services: number };
}

interface Props {
  businessId: string;
  businessCategory: string;
  categoryLabel: string;
}

export default function SubcategoryManager({ businessId, businessCategory, categoryLabel }: Props) {
  const toast = useToast();
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/subcategories`);
      setSubs(res.data.subcategories ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/businesses/${businessId}/subcategories`, {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        category: businessCategory,
      });
      setSubs(prev => [...prev, res.data.subcategory]);
      setNewName('');
      setNewDesc('');
      setShowForm(false);
      toast.show('Subcategoría creada', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al crear subcategoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subId: string) => {
    setDeletingId(subId);
    try {
      await api.delete(`/businesses/${businessId}/subcategories/${subId}`);
      setSubs(prev => prev.filter(s => s.id !== subId));
      setConfirmId(null);
      toast.show('Subcategoría eliminada', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al eliminar subcategoría', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-8 border border-indigo-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-indigo-50/60 hover:bg-indigo-50 transition text-left"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-indigo-800 text-sm">
            Subcategorías de {categoryLabel}
          </span>
          <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
            {subs.length}
          </span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-indigo-400" />}
      </button>

      {open && (
        <div className="p-5 space-y-3 bg-white">
          <p className="text-xs text-gray-400">
            Las subcategorías agrupan tus servicios dentro de {categoryLabel}. Ejemplo: Hombre / Mujer, Adultos / Niños.
          </p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : subs.length === 0 && !showForm ? (
            <div className="py-4 text-center text-sm text-gray-400">
              Sin subcategorías todavía. Crea una para organizar tus servicios.
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map(sub => (
                <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{sub.name}</p>
                    {sub.description && <p className="text-xs text-gray-400">{sub.description}</p>}
                    <p className="text-xs text-indigo-500 mt-0.5">{sub._count?.services ?? 0} servicio(s)</p>
                  </div>
                  {confirmId === sub.id ? (
                    <div className="flex items-center gap-1.5 ml-3">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        disabled={deletingId === sub.id}
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        {deletingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs font-bold px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(sub.id)}
                      className="ml-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleCreate} className="border border-indigo-200 rounded-xl p-4 space-y-3 bg-indigo-50/30">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-indigo-700">Nueva subcategoría</p>
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); setNewDesc(''); }}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Nombre (ej: Hombre, Niños, Clásico…)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={100}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Descripción opcional"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                maxLength={200}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setNewName(''); setNewDesc(''); }}
                  className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !newName.trim()}
                  className="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-1">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Crear
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition"
            >
              <Plus className="w-4 h-4" /> Agregar subcategoría
            </button>
          )}
        </div>
      )}
    </div>
  );
}
