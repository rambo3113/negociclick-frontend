'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { useToast } from '@/components/Toast';
import { User, Mail, Phone, Shield, Pencil, Save, Lock, Eye, EyeOff, Calendar, X, Loader2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente', VENDOR: 'Vendedor', ADMIN: 'Administrador',
};
const ROLE_COLORS: Record<string, string> = {
  CLIENT: 'bg-gray-100 text-gray-700', VENDOR: 'bg-indigo-100 text-indigo-700', ADMIN: 'bg-red-100 text-red-700',
};

export default function ProfilePage() {
  const { user, loading, logout, setUser } = useAuth() as any;
  const router = useRouter();
  const toast = useToast();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [editingPassword, setEditingPassword] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, next: false });
  const [savingPass, setSavingPass] = useState(false);

  const [stats, setStats] = useState<{ total: number; completed: number; pending: number } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name ?? '', phone: user.phone ?? '' });
    api.get('/bookings/my').then(res => {
      const bookings = res.data.bookings ?? [];
      setStats({
        total:     bookings.length,
        completed: bookings.filter((b: any) => b.status === 'COMPLETED').length,
        pending:   bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'CONFIRMED').length,
      });
    }).catch(() => {});
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (setUser) setUser((prev: any) => ({ ...prev, ...res.data.user }));
      setEditingProfile(false);
      toast.show('Perfil actualizado correctamente', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al guardar perfil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.next !== passForm.confirm) {
      toast.show('Las contraseñas nuevas no coinciden', 'error'); return;
    }
    if (passForm.next.length < 6) {
      toast.show('La contraseña debe tener al menos 6 caracteres', 'error'); return;
    }
    setSavingPass(true);
    try {
      await api.put('/auth/password', { currentPassword: passForm.current, newPassword: passForm.next });
      setEditingPassword(false);
      setPassForm({ current: '', next: '', confirm: '' });
      toast.show('Contraseña actualizada correctamente', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al cambiar contraseña', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-xl flex-shrink-0">
            <span className="text-4xl font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black">{user.name}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-1 inline-block ${ROLE_COLORS[user.role] ?? 'bg-white/20 text-white'}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <p className="text-white/50 text-sm mt-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />{user.email}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 py-8 space-y-5">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total reservas', value: stats.total,     color: 'text-indigo-600' },
              { label: 'Completadas',    value: stats.completed, color: 'text-green-600' },
              { label: 'Activas',        value: stats.pending,   color: 'text-yellow-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Datos personales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Datos personales</h2>
            {!editingProfile && (
              <button onClick={() => { setEditingProfile(true); setProfileForm({ name: user.name, phone: user.phone ?? '' }); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            )}
          </div>

          {editingProfile ? (
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre completo *</label>
                <input type="text" required value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono / WhatsApp</label>
                <input type="tel" value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                  placeholder="987654321"
                  maxLength={9}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingProfile(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  <X className="w-4 h-4 inline mr-1" />Cancelar
                </button>
                <button type="submit" disabled={savingProfile}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-4">
              {[
                { icon: User,     label: 'Nombre',    value: user.name },
                { icon: Mail,     label: 'Email',     value: user.email },
                { icon: Phone,    label: 'Teléfono',  value: user.phone || 'No registrado' },
                { icon: Shield,   label: 'Rol',       value: ROLE_LABELS[user.role] ?? user.role },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-900">Contraseña</h2>
            </div>
            {!editingPassword && (
              <button onClick={() => setEditingPassword(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition">
                <Pencil className="w-3.5 h-3.5" /> Cambiar
              </button>
            )}
          </div>

          {editingPassword ? (
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {[
                { key: 'current', label: 'Contraseña actual',     show: showPass.current, toggle: () => setShowPass(p => ({ ...p, current: !p.current })) },
                { key: 'next',    label: 'Nueva contraseña',      show: showPass.next,    toggle: () => setShowPass(p => ({ ...p, next: !p.next })) },
                { key: 'confirm', label: 'Confirmar contraseña',  show: showPass.next,    toggle: () => setShowPass(p => ({ ...p, next: !p.next })) },
              ].map(({ key, label, show, toggle }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'} required
                      value={(passForm as any)[key]}
                      onChange={e => setPassForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition pr-10"
                    />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setEditingPassword(false); setPassForm({ current: '', next: '', confirm: '' }); }}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={savingPass}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Actualizar
                </button>
              </div>
            </form>
          ) : (
            <div className="px-6 py-4">
              <p className="text-sm text-gray-400">••••••••••••</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-3">
          {(user.role === 'VENDOR' || user.role === 'ADMIN') && (
            <button onClick={() => router.push('/dashboard')}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" /> Ir al Dashboard
            </button>
          )}
          <button onClick={() => router.push('/bookings')}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Mis reservas
          </button>
          <button onClick={() => { logout(); router.push('/'); }}
            className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition">
            Cerrar sesión
          </button>
        </div>

      </main>
    </div>
  );
}
