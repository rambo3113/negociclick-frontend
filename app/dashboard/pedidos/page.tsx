'use client';
import { useEffect, useState } from 'react';
import BookingTimeline from '../../components/BookingTimeline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Business { id: string; name: string; orderMode: string }
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
  service:  { name: string };
  client:   { name: string; phone?: string | null; email: string };
  payment?: { status: string; provider: string } | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmada',  color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completada',  color: 'bg-green-100 text-green-800' },
  DELIVERED: { label: 'Entregado',   color: 'bg-green-100 text-green-800' },
  PREPARING: { label: 'Preparando',  color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: 'Cancelada',   color: 'bg-red-100 text-red-800' },
};

const NEXT_STATUS: Record<string, { appt: string; order: string; label: string }[]> = {
  PENDING:   [{ appt: 'CONFIRMED', order: 'PREPARING', label: 'Confirmar' }],
  CONFIRMED: [{ appt: 'COMPLETED', order: 'COMPLETED', label: 'Completar' }],
  PREPARING: [{ appt: 'DELIVERED', order: 'DELIVERED', label: 'Entregado' }],
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PedidosPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bizId, setBizId]           = useState('');
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [timelines, setTimelines]   = useState<Record<string, any[]>>({});
  const [tlLoading, setTlLoading]   = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => {
    fetch(`${API}/businesses/my`, {
      headers: { Authorization: `Bearer ${typeof window !== 'undefined' && localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => {
        const list: Business[] = d.businesses ?? (Array.isArray(d) ? d : []);
        setBusinesses(list);
        if (list.length) setBizId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (bizId) fetchBookings();
  }, [bizId, page, statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/bookings/business/${bizId}?${params}`, {
        headers: { Authorization: `Bearer ${typeof window !== 'undefined' && localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setBookings(data.bookings ?? data);
      setTotal(data.total ?? (data.bookings ?? data).length);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(bookingId: string, newStatus: string) {
    setActionLoading(bookingId + newStatus);
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' && localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'Error'); return; }
      fetchBookings();
    } finally {
      setActionLoading(null);
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

  const currentBiz = businesses.find(b => b.id === bizId);
  const isOrder = currentBiz?.orderMode === 'ORDER';
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de pedidos</h1>

        {/* Selector de negocio */}
        {businesses.length > 1 && (
          <div className="mb-6">
            <select
              value={bizId}
              onChange={e => { setBizId(e.target.value); setPage(1); }}
              className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['', 'PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'DELIVERED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === s
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
          <div className="text-center py-16 text-gray-400">
            No hay {statusFilter ? STATUS_LABEL[statusFilter]?.label.toLowerCase() + 's' : 'pedidos'} aún.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const meta = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-800' };
              const nextActions = NEXT_STATUS[b.status] ?? [];
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{b.service.name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          Cliente: <span className="font-medium">{b.client.name}</span>
                          {b.client.phone && <> · {b.client.phone}</>}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {isOrder ? '📅 Entrega:' : '🕒'} {fmt(b.date)}
                        </p>
                        {b.deliveryAddress && (
                          <p className="text-sm text-gray-400 mt-0.5">📍 {b.deliveryAddress}</p>
                        )}
                        {b.notes && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">📝 {b.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-2">S/ {Number(b.totalAmount).toFixed(2)}</p>
                        {b.payment && (
                          <p className={`text-xs mt-0.5 ${b.payment.status === 'PAID' ? 'text-green-600' : 'text-gray-400'}`}>
                            {b.payment.status === 'PAID' ? '✅ Pagado' : '⏳ Pendiente'}
                            {b.payment.provider === 'CASH' ? ' (efectivo)' : ' (Culqi)'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => toggleTimeline(b.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        {expanded === b.id ? 'Ocultar historial' : 'Ver historial'}
                      </button>
                      {nextActions.map(action => {
                        const nextS = isOrder ? action.order : action.appt;
                        const key = b.id + nextS;
                        return (
                          <button
                            key={nextS}
                            disabled={actionLoading === key}
                            onClick={() => updateStatus(b.id, nextS)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === key ? '...' : action.label}
                          </button>
                        );
                      })}
                      {['PENDING', 'CONFIRMED', 'PREPARING'].includes(b.status) && (
                        <button
                          disabled={actionLoading === b.id + 'CANCELLED'}
                          onClick={() => updateStatus(b.id, 'CANCELLED')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === b.id + 'CANCELLED' ? '...' : 'Cancelar'}
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
