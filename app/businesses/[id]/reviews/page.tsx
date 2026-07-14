'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Star, ChevronLeft, Loader2 } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  client: { name: string; avatar?: string | null };
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`;
  return `hace ${Math.floor(diff / 31536000)} años`;
}

const STAR_FILTERS = [
  { label: 'Todas', value: 0 },
  { label: '⭐5', value: 5 },
  { label: '⭐4', value: 4 },
  { label: '⭐3', value: 3 },
  { label: '⭐2', value: 2 },
  { label: '⭐1', value: 1 },
];

export default function AllReviewsPage() {
  const { id } = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState(0);
  const [bizName, setBizName] = useState('');

  const fetchReviews = useCallback(async (p: number, star: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '10' });
      if (star) params.set('rating', String(star));
      const res = await api.get(`/businesses/${id}/reviews?${params}`);
      setReviews(res.data.reviews ?? []);
      setTotal(res.data.count ?? 0);
      setPages(res.data.totalPages ?? 1);
      setAverageRating(res.data.averageRating ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    api.get(`/businesses/${id}`).then(r => setBizName(r.data.business?.name ?? '')).catch(() => {});
    fetchReviews(1, 0);
  }, [id, fetchReviews]);

  const handleStarFilter = (star: number) => {
    setStarFilter(star);
    setPage(1);
    fetchReviews(1, star);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchReviews(p, starFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <Link href={`/businesses/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ChevronLeft className="w-4 h-4" /> Volver al negocio
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mb-1">Reseñas</h1>
        {bizName && <p className="text-sm text-gray-400 mb-4">{bizName}</p>}

        {averageRating && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-black text-gray-900">{averageRating}</p>
              <StarRow rating={Math.round(averageRating)} />
              <p className="text-xs text-gray-400 mt-1">{total} reseña{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Star filters */}
        <div className="flex gap-2 flex-wrap mb-5">
          {STAR_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleStarFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                starFilter === f.value
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Sin reseñas{starFilter ? ` de ${starFilter} estrella${starFilter !== 1 ? 's' : ''}` : ''}</div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 border-l-indigo-400">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.client.name}</p>
                    <p className="text-xs text-gray-400">{timeAgo(r.createdAt)}</p>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
              ← Anterior
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => handlePage(p)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                  page === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => handlePage(page + 1)} disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
