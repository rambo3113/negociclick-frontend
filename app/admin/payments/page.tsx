'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, TrendingUp, Download } from 'lucide-react';

interface Payment {
  id: string;
  type: 'booking' | 'featured';
  amount: number;
  commission: number;
  currency: string;
  status: string;
  date: string;
  businessId: string;
  businessName: string;
  reference: string | null;
}

interface Summary {
  totalVolume: number;
  totalCommission: number;
  count: number;
}

const TYPE_LABEL: Record<string, string> = { booking: 'Reserva', featured: 'Destacado' };
const TYPE_COLOR: Record<string, string> = {
  booking:  'bg-indigo-900/50 text-indigo-300',
  featured: 'bg-amber-900/50 text-amber-300',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState('month');
  const [month, setMonth]       = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (period === 'month') params.set('month', month);
    api.get(`/admin/payments?${params}`)
      .then(r => { setPayments(r.data.payments); setSummary(r.data.summary); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, month]);

  const exportCSV = () => {
    const header = 'Fecha,Tipo,Negocio,Monto,Comisión,Referencia';
    const rows = payments.map(p =>
      `${new Date(p.date).toLocaleDateString('es-PE')},${TYPE_LABEL[p.type]},${p.businessName},${p.amount.toFixed(2)},${p.commission.toFixed(2)},${p.reference ?? ''}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `pagos-${month || period}.csv`; a.click();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Pagos de plataforma</h1>
          <p className="text-gray-500 text-sm">Comisiones e ingresos de destacados</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none">
            <option value="month">Este mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Este año</option>
          </select>
          {period === 'month' && (
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none" />
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-2 border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Transacciones', value: summary.count },
            { label: 'Volumen total', value: `S/ ${summary.totalVolume.toFixed(2)}` },
            { label: 'Comisión captada', value: `S/ ${summary.totalCommission.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-indigo-400 animate-spin" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium">Negocio</th>
                  <th className="text-right px-4 py-3 font-medium">Monto</th>
                  <th className="text-right px-5 py-3 font-medium">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(p.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${TYPE_COLOR[p.type]}`}>
                        {TYPE_LABEL[p.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-200">{p.businessName}</td>
                    <td className="px-4 py-3 text-right text-gray-300">S/ {p.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-400">
                      S/ {p.commission.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-600">Sin pagos en este período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
