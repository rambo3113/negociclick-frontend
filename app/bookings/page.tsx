'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Calendar, MapPin, Clock, CheckCircle, Star, X, Send, Loader2, RefreshCw, CreditCard, AlertTriangle } from 'lucide-react';
import CulqiPaymentModal from '@/components/CulqiPaymentModal';

interface Booking {
  id: string;
  date: string;
  status: string;
  totalAmount: number;
  notes?: string;
  service: { name: string; duration?: number };
  business: { name: string; city: string; ownerPlan?: string };
  review?: { id: string; rating: number; comment?: string | null };
}

interface PaymentSession {
  paymentId: string;
  booking: Booking;
}


const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelada',  color: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muy malo', 2: 'Malo', 3: 'Regular', 4: 'Bueno', 5: 'Excelente',
};

function BookingsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleHour, setRescheduleHour] = useState('9');
  const [rescheduleMinute, setRescheduleMinute] = useState('00');
  const [rescheduleAmPm, setRescheduleAmPm] = useState<'AM' | 'PM'>('AM');
  const [rescheduling, setRescheduling] = useState(false);

  const [initiatingPayment, setInitiatingPayment] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadBookings = useCallback(() => {
    api.get('/bookings/my')
      .then(res => setBookings(res.data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) loadBookings();
  }, [user, authLoading, router, loadBookings]);

  // Auto-refresco cada 30 segundos
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(loadBookings, 30_000);
    return () => clearInterval(interval);
  }, [user, loadBookings]);

  const openReschedule = (bookingId: string) => {
    setReschedulingId(bookingId);
    setRescheduleDate('');
    setRescheduleHour('9');
    setRescheduleMinute('00');
    setRescheduleAmPm('AM');
    setReviewingId(null);
  };

  const buildRescheduleISO = () => {
    if (!rescheduleDate) return '';
    let h = parseInt(rescheduleHour);
    if (rescheduleAmPm === 'PM' && h !== 12) h += 12;
    if (rescheduleAmPm === 'AM' && h === 12) h = 0;
    return `${rescheduleDate}T${String(h).padStart(2, '0')}:${rescheduleMinute}:00`;
  };

  const handleReschedule = async (id: string) => {
    const iso = buildRescheduleISO();
    if (!iso) return;
    setRescheduling(true);
    try {
      await api.put(`/bookings/${id}/reschedule`, { date: iso });
      setBookings(prev => prev.map(b =>
        b.id === id ? { ...b, date: iso, status: 'PENDING' } : b
      ));
      setReschedulingId(null);
      toast.show('Cita reagendada correctamente', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al reagendar', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirmCancelId !== id) { setConfirmCancelId(id); return; }
    setConfirmCancelId(null);
    setCancelling(id);
    try {
      await api.delete(`/bookings/${id}`);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      toast.show('Reserva cancelada', 'info');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al cancelar', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const handleInitiatePayment = async (booking: Booking) => {
    setInitiatingPayment(booking.id);
    try {
      const res = await api.post('/payments', { bookingId: booking.id });
      setPaymentSession({ paymentId: res.data.payment.id, booking });
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al iniciar el pago', 'error');
    } finally {
      setInitiatingPayment(null);
    }
  };

  const openReviewForm = (bookingId: string) => {
    setReviewingId(bookingId);
    setReviewRating(0);
    setReviewComment('');
    setReschedulingId(null);
  };

  const handleSubmitReview = async (bookingId: string) => {
    if (reviewRating === 0) { toast.show('Selecciona una calificación', 'error'); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', { bookingId, rating: reviewRating, comment: reviewComment || undefined });
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, review: res.data.review } : b
      ));
      setReviewingId(null);
      toast.show('Reseña publicada. ¡Gracias!', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al enviar la reseña', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'TODAS' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('TODAS');

  const pendingCount   = bookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;

  const filteredBookings = activeTab === 'TODAS'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const getCountdownLabel = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3_600_000);
    const mins  = Math.floor((diff % 3_600_000) / 60_000);
    if (hours < 1)   return `en ${mins}m`;
    if (hours < 24)  return `en ${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `en ${days}d`;
  };

  const TABS: { key: typeof activeTab; label: string; count?: number }[] = [
    { key: 'TODAS',     label: 'Todas',      count: bookings.length },
    { key: 'PENDING',   label: 'Pendientes', count: pendingCount },
    { key: 'CONFIRMED', label: 'Confirmadas',count: confirmedCount },
    { key: 'COMPLETED', label: 'Completadas',count: bookings.filter(b => b.status === 'COMPLETED').length },
    { key: 'CANCELLED', label: 'Canceladas', count: bookings.filter(b => b.status === 'CANCELLED').length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Mis reservas</h1>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
            {confirmedCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {confirmedCount} confirmada{confirmedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status tabs */}
        {!loading && bookings.length > 0 && (
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando reservas...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No tienes reservas todavía</h3>
            <p className="text-gray-500 text-sm mb-5">Explora los negocios y reserva tu primera cita.</p>
            <button onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
              Explorar negocios
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No hay reservas en esta categoría.</p>
            <button onClick={() => setActiveTab('TODAS')} className="mt-3 text-sm text-indigo-600 font-semibold hover:underline">
              Ver todas
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const meta = STATUS_META[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
              const isCancelling = cancelling === booking.id;
              const isReviewing = reviewingId === booking.id;
              const isRescheduling = reschedulingId === booking.id;
              const awaitingCancelConfirm = confirmCancelId === booking.id;
              const canManage = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    booking.status === 'PENDING'
                      ? 'border-yellow-200 shadow-sm shadow-yellow-50'
                      : booking.status === 'CANCELLED'
                      ? 'border-gray-100 opacity-70'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {(() => {
                            const multiMatch = booking.notes?.match(/^\[SERVICIOS: (.+?)\]/);
                            return multiMatch ? multiMatch[1] : booking.service.name;
                          })()}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {booking.business.name} · {booking.business.city}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${meta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        {new Date(booking.date).toLocaleDateString('es-PE', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                        {!booking.notes?.startsWith('[PEDIDO]') && (
                          <>{' · '}{new Date(booking.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}</>
                        )}
                      </span>
                      {booking.service.duration && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          {booking.service.duration} min
                        </span>
                      )}
                    </div>

                    {/* Countdown badge */}
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (() => {
                      const label = getCountdownLabel(booking.date);
                      return label ? (
                        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl mb-3 ${
                          booking.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          Tu cita es {label}
                        </div>
                      ) : null;
                    })()}

                    {/* Review display */}
                    {booking.review && !isReviewing && (
                      <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={`w-3.5 h-3.5 ${n <= booking.review!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        {booking.review.comment && (
                          <p className="text-xs text-gray-500 truncate">{booking.review.comment}</p>
                        )}
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 ml-auto" />
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900 text-lg">
                        S/ {Number(booking.totalAmount).toFixed(2)}
                      </span>

                      <div className="flex gap-2 flex-wrap justify-end">
                        {/* Pagar ahora (solo PREMIUM) */}
                        {booking.status === 'PENDING' && booking.business.ownerPlan === 'PREMIUM' && (
                          <button
                            onClick={() => handleInitiatePayment(booking)}
                            disabled={initiatingPayment === booking.id}
                            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition font-bold disabled:opacity-60"
                          >
                            {initiatingPayment === booking.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <CreditCard className="w-3.5 h-3.5" />
                            }
                            Pagar ahora
                          </button>
                        )}

                        {/* Reagendar */}
                        {canManage && !isRescheduling && (
                          <button
                            onClick={() => openReschedule(booking.id)}
                            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition font-medium"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reagendar
                          </button>
                        )}

                        {/* Dejar reseña */}
                        {booking.status === 'COMPLETED' && !booking.review && !isReviewing && (
                          <button
                            onClick={() => openReviewForm(booking.id)}
                            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition font-medium"
                          >
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            Dejar reseña
                          </button>
                        )}

                        {/* Cancelar */}
                        {canManage && (
                          awaitingCancelConfirm ? (
                            <div className="flex flex-col gap-1.5 items-end">
                              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                Solo con 2+ horas de anticipación
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500">¿Cancelar?</span>
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={isCancelling}
                                  className="text-xs font-bold px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                                >
                                  {isCancelling ? '...' : 'Sí'}
                                </button>
                                <button
                                  onClick={() => setConfirmCancelId(null)}
                                  className="text-xs font-bold px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="text-sm px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition font-medium"
                            >
                              Cancelar
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline reschedule form */}
                  {isRescheduling && (
                    <div className="border-t border-gray-100 bg-indigo-50/50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-gray-900 text-sm">Reagendar cita</p>
                        <button onClick={() => setReschedulingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={e => setRescheduleDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={rescheduleHour}
                            onChange={e => setRescheduleHour(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                              <option key={h} value={String(h)}>{String(h).padStart(2,'0')}</option>
                            ))}
                          </select>
                          <select
                            value={rescheduleMinute}
                            onChange={e => setRescheduleMinute(e.target.value)}
                            className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {['00','15','30','45'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="flex rounded-xl overflow-hidden border border-gray-200">
                            {(['AM','PM'] as const).map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setRescheduleAmPm(p)}
                                className={`px-4 py-2.5 text-sm font-bold transition-colors ${rescheduleAmPm === p ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setReschedulingId(null)}
                          className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition">
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleReschedule(booking.id)}
                          disabled={rescheduling || !rescheduleDate}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {rescheduling
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <RefreshCw className="w-4 h-4" />
                          }
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline review form */}
                  {isReviewing && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Tu opinión sobre {booking.business.name}</p>
                          {reviewRating > 0 && (
                            <p className="text-xs text-yellow-600 mt-0.5">{RATING_LABELS[reviewRating]}</p>
                          )}
                        </div>
                        <button onClick={() => setReviewingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <StarPicker value={reviewRating} onChange={setReviewRating} />

                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Cuéntanos tu experiencia (opcional)..."
                        rows={2}
                        className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />

                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setReviewingId(null)}
                          className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition">
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSubmitReview(booking.id)}
                          disabled={submittingReview || reviewRating === 0}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {submittingReview
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                          }
                          Publicar reseña
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {paymentSession && (
        <CulqiPaymentModal
          booking={{
            id: paymentSession.booking.id,
            service: { name: paymentSession.booking.service.name },
            business: { name: paymentSession.booking.business.name },
            date: paymentSession.booking.date,
            totalAmount: paymentSession.booking.totalAmount,
          }}
          paymentId={paymentSession.paymentId}
          onSuccess={() => {
            setBookings(prev => prev.map(b =>
              b.id === paymentSession.booking.id ? { ...b, status: 'CONFIRMED' } : b
            ));
            toast.show('¡Pago exitoso! Reserva confirmada.', 'success');
          }}
          onClose={() => setPaymentSession(null)}
        />
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
