'use client';

interface TimelineEntry {
  id: string;
  event: string;
  description?: string | null;
  actor: string;
  timestamp: string;
}

const EVENT_META: Record<string, { label: string; color: string; icon: string }> = {
  CREATED:           { label: 'Reserva creada',        color: '#6366F1', icon: '📋' },
  PAYMENT_CONFIRMED: { label: 'Pago confirmado',        color: '#10B981', icon: '💳' },
  STATUS_UPDATED:    { label: 'Estado actualizado',     color: '#3B82F6', icon: '🔄' },
  CANCELLED:         { label: 'Cancelada',              color: '#EF4444', icon: '❌' },
  COMPLETED:         { label: 'Completada',             color: '#10B981', icon: '✅' },
  REVIEW_LEFT:       { label: 'Reseña dejada',          color: '#F59E0B', icon: '⭐' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function BookingTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-gray-400 text-center py-4">Sin eventos registrados aún.</p>;
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {entries.map((e, i) => {
        const meta = EVENT_META[e.event] ?? { label: e.event, color: '#9CA3AF', icon: '•' };
        return (
          <li key={e.id} className="ml-6">
            <span
              className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white text-sm"
              style={{ backgroundColor: meta.color + '20', color: meta.color }}
            >
              {meta.icon}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
              {e.description && (
                <span className="text-xs text-gray-500 mt-0.5">{e.description}</span>
              )}
              <span className="text-xs text-gray-400 mt-1">{fmt(e.timestamp)}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
