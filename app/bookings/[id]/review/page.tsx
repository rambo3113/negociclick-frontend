'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Star } from 'lucide-react';

export default function ReviewPage() {
  const { id: bookingId } = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) { setError('Selecciona una puntuación'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', { bookingId, rating, comment });
      router.push('/bookings');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar reseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto w-full px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dejar reseña</h1>
          <p className="text-gray-500 text-sm mb-6">Cuéntanos cómo fue tu experiencia</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Estrellas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Puntuación</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hovered || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
                </p>
              )}
            </div>

            {/* Comentario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                placeholder="¿Qué te pareció el servicio?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/bookings')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Publicar reseña'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
