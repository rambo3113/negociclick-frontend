'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Star, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface FeaturedBusiness {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  phone: string;
  address: string;
  photo: string | null;
  photoCaption: string;
}

export default function FeaturedSlider() {
  const [featured, setFeatured] = useState<FeaturedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${API}/featured-businesses`);
        const data = await res.json();

        if (data.success && data.featured && data.featured.length > 0) {
          setFeatured(data.featured);
        } else {
          setFeatured([]);
        }
      } catch (err) {
        console.error('[FeaturedSlider] Error fetching:', err);
        setError('Error al cargar negocios destacados');
        setFeatured([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // Si no hay destacados, no mostrar nada
  if (loading) return null;
  if (!featured || featured.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-b from-indigo-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Negocios Destacados
            </h2>
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-gray-600 text-sm">
            Los mejores negocios seleccionados para ti
          </p>
        </div>

        {/* Slider */}
        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            navigation={true}
            pagination={{ clickable: true, dynamicBullets: true }}
            loop={featured.length > 1}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 28 },
            }}
            className="featured-slider-swiper"
          >
            {featured.map(business => (
              <SwiperSlide key={business.id}>
                <Link href={`/businesses/${business.id}`}>
                  <div className="group h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-amber-200 cursor-pointer">
                    {/* Imagen */}
                    <div className="relative h-48 md:h-56 bg-gray-200 overflow-hidden">
                      {business.photo ? (
                        <img
                          src={business.photo}
                          alt={business.photoCaption}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                          <span className="text-gray-400 text-sm">Sin imagen</span>
                        </div>
                      )}

                      {/* Badge "DESTACADO" */}
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        DESTACADO
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-5 md:p-6">
                      {/* Nombre y Categoría */}
                      <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {business.name}
                      </h3>
                      <p className="text-xs md:text-sm text-amber-600 font-semibold mb-3">
                        {business.category}
                      </p>

                      {/* Descripción */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {business.description || 'Negocio destacado de NegociClick'}
                      </p>

                      {/* Ubicación y Teléfono */}
                      <div className="space-y-2 mb-4 text-xs md:text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{business.address || business.city}</span>
                        </div>
                        {business.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Botón */}
                      <div className="pt-3 border-t border-gray-100">
                        <button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 rounded-lg transition-all duration-300 text-sm md:text-base">
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .featured-slider-swiper .swiper-button-next,
        .featured-slider-swiper .swiper-button-prev {
          background-color: rgba(79, 70, 229, 0.9);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .featured-slider-swiper .swiper-button-next:hover,
        .featured-slider-swiper .swiper-button-prev:hover {
          background-color: rgba(79, 70, 229, 1);
          transform: scale(1.1);
        }

        .featured-slider-swiper .swiper-button-next::after,
        .featured-slider-swiper .swiper-button-prev::after {
          font-size: 20px;
        }

        .featured-slider-swiper .swiper-pagination-bullet {
          background-color: rgba(79, 70, 229, 0.4);
          opacity: 1;
        }

        .featured-slider-swiper .swiper-pagination-bullet-active {
          background-color: rgba(79, 70, 229, 1);
        }

        @media (max-width: 768px) {
          .featured-slider-swiper .swiper-button-next,
          .featured-slider-swiper .swiper-button-prev {
            width: 36px;
            height: 36px;
          }

          .featured-slider-swiper .swiper-button-next::after,
          .featured-slider-swiper .swiper-button-prev::after {
            font-size: 18px;
          }
        }
      `}</style>
    </section>
  );
}
