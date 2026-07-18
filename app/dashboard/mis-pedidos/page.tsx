'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BookingTimeline from '../../components/BookingTimeline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Booking {
  id: string;
  date: string;
  status: string;
  totalAmount: number;
  notes?: string | null;
  deliveryAddress?: string | null;
  createdAt: string;
  paymentConfirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  service: { name: string; duration?: number };
  business: { name: string; phone: string; city: string; orderMode: string };
  payment?: { status: string } | null;
  review?: { rating: number } | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendiente',    color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmada',   color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completada',   color: 'bg-green-100 text-green-800' },
  DELIVERED: { label: 'Entregado',    color: 'bg-green-100 text-green-800' },
  PREPARING: { label: 'Preparando',   color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: 'Cancelada',    color: 'bg-red-100 text-red-800' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MisPedidosPage() {
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState('');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [timelines, setTimelines]   = useState<Record<string, any[]>>({});
  const [tlLoading, setTlLoading]   = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    fetchBookings();
  }, [page, status]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set('status', status);
      const res = await fetch(`${API}/bookings/my?${params}`, {
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' && localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setBookings(data.bookings ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTimeline(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (timelines[id]) return;
    setTlLoading(id);
    try {
      const res = await fetch(`${API}/bookings/${id}/timeline`, {
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' && localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setTimelines(prev => ({ ...prev, [id]: data.timeline ?? [] }));
    } finally {
      setTlLoading(null);
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    const res = await fetch(`${API}/bookings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${typeof window !== 'undefined' && localStorage.getItem('token')}` },
    });
    if (res.ok) fetchBookings();
    else {
      const d = await res.json();
      alert(d.error ?? 'Error al cancelar');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis pedidos y citas</h1>

        {/* Filtro de estado */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['', 'PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'DELIVERED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                status === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s === '' ? 'Todos' : (STATUS_LABEL[s]?.label ?? s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">No tienes pedidos aún.</p>
            <Link href="/negocios" className="text-indigo-600 font-medium hover:underline">
              Explorar negocios →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const meta = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-800' };
              const isOrder = b.business.orderMode === 'ORDER';
              const canCancel = ['PENDING', 'CONFIRMED'].includes(b.status);
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{b.service.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{b.business.name} · {b.business.city}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {isOrder ? '📅 Entrega:' : '🕒'} {fmt(b.date)}
                        </p>
                        {b.deliveryAddress && (
                          <p className="text-sm text-gray-400 mt-0.5">📍 {b.deliveryAddress}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-2">S/ {Number(b.totalAmount).toFixed(2)}</p>
                        {b.payment && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {b.payment.status === 'PAID' ? '💳 Pagado' : '💵 Pendiente'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => toggleTimeline(b.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        {expanded === b.id ? 'Ocultar historial' : 'Ver historial'}
                      </button>
                      {b.status === 'COMPLETED' && !b.review && (
                        <Link
                          href={`/businesses/${b.business.name}`}
                          className="text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                        >
                          ⭐ Dejar reseña
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded === b.id && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      {tlLoading === b.id ? (
                        <p className="text-sm text-gray-400">Cargando historial...</p>
                      ) : (
                        <BookingTimeline entries={timelines[b.id] ?? []} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
