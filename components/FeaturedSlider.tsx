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

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${API}/featured-businesses`);
        const data = await res.json();
        if (data.success && data.featured?.length > 0) {
          setFeatured(data.featured);
        }
      } catch (err) {
        console.error('[FeaturedSlider] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading || !featured?.length) return null;

  return (
    <section className="w-full bg-gradient-to-b from-indigo-50 to-white py-6 xs:py-8 sm:py-12 md:py-16 px-1.5 xs:px-2 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 xs:mb-6 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-1 mb-1 xs:mb-2 sm:mb-3">
            <Star className="w-3 xs:w-4 sm:w-6 h-3 xs:h-4 sm:h-6 text-amber-500 fill-amber-500" />
            <h2 className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              Negocios Destacados
            </h2>
            <Star className="w-3 xs:w-4 sm:w-6 h-3 xs:h-4 sm:h-6 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-gray-600 text-[10px] xs:text-xs sm:text-base md:text-lg">
            Los mejores negocios seleccionados para ti
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            navigation={true}
            pagination={{ clickable: true, dynamicBullets: true }}
            loop={featured.length > 1}
            spaceBetween={12}
            slidesPerView={1}
            breakpoints={{
              320: { slidesPerView: 1, spaceBetween: 12 },
              480: { slidesPerView: 1.2, spaceBetween: 14 },
              640: { slidesPerView: 1.5, spaceBetween: 16 },
              768: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 2.5, spaceBetween: 24 },
              1280: { slidesPerView: 3, spaceBetween: 28 },
              1536: { slidesPerView: 3.5, spaceBetween: 32 },
            }}
            className="featured-slider-swiper"
          >
            {featured.map(business => (
              <SwiperSlide key={business.id}>
                <Link href={`/businesses/${business.id}`}>
                  <div className="group h-full bg-white rounded-lg xs:rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-amber-200 cursor-pointer">
                    {/* Image */}
                    <div className="relative h-20 xs:h-24 sm:h-40 md:h-48 lg:h-56 xl:h-64 bg-gray-200 overflow-hidden">
                      {business.photo ? (
                        <img
                          src={business.photo}
                          alt={business.photoCaption}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                          <span className="text-gray-400 text-xs xs:text-sm">Sin imagen</span>
                        </div>
                      )}

                      {/* Badge */}
                      <div className="absolute top-0 right-0 xs:top-1 xs:right-1 sm:top-3 sm:right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-0.5 xs:px-2 sm:px-3 py-0 xs:py-0.5 sm:py-1 rounded-b-lg xs:rounded-full text-[8px] xs:text-xs font-bold flex items-center gap-0.25 xs:gap-0.5 sm:gap-1 shadow-lg">
                        <Star className="w-1 h-1 xs:w-2 xs:h-2 sm:w-3 sm:h-3 fill-current" />
                        <span className="hidden sm:inline">DESTACADO</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-1 xs:p-2 sm:p-4 md:p-5 lg:p-6 w-full overflow-hidden">
                      {/* Nombre - SOLO en xs (480px+) en adelante */}
                      <h3 className="hidden xs:block font-bold text-xs sm:text-lg md:text-xl lg:text-2xl text-gray-900 mb-0.5 xs:mb-1 group-hover:text-indigo-600 transition-colors truncate">
                        {business.name}
                      </h3>
                      
                      {/* En móvil pequeño (320px): mostrar categoría como título principal */}
                      <p className="xs:hidden font-bold text-[11px] text-gray-900 mb-1 truncate">
                        {business.category}
                      </p>
                      
                      {/* Categoría - visible en xs+ solo si hay nombre */}
                      <p className="hidden xs:block text-[10px] xs:text-xs sm:text-sm text-amber-600 font-semibold mb-0.5 xs:mb-1 sm:mb-3 truncate">
                        {business.category}
                      </p>

                      <p className="text-[9px] xs:text-xs sm:text-sm text-gray-600 mb-0.5 xs:mb-2 line-clamp-2">
                        {business.description || 'Negocio destacado de NegociClick'}
                      </p>

                      <div className="space-y-0 xs:space-y-1 sm:space-y-2 mb-0.5 xs:mb-2">
                        <div className="flex items-center gap-0.5 xs:gap-1 min-w-0 text-[9px] xs:text-xs sm:text-sm text-gray-700">
                          <MapPin className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{business.address || business.city}</span>
                        </div>
                        {business.phone && (
                          <div className="flex items-center gap-0.5 xs:gap-1 min-w-0 text-[9px] xs:text-xs sm:text-sm text-gray-700">
                            <Phone className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                            <span className="truncate">{business.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-0.5 xs:pt-2 sm:pt-3 border-t border-gray-100">
                        <button className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-0.5 xs:py-1.5 sm:py-2 rounded transition-all duration-300 text-[9px] xs:text-xs sm:text-sm md:text-base">
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

      <style jsx global>{`
        .featured-slider-swiper .swiper-button-next,
        .featured-slider-swiper .swiper-button-prev {
          background-color: rgba(79, 70, 229, 0.9);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.3s ease;
          display: none;
        }

        .featured-slider-swiper .swiper-button-next:hover,
        .featured-slider-swiper .swiper-button-prev:hover {
          background-color: rgba(79, 70, 229, 1);
          transform: scale(1.1);
        }

        .featured-slider-swiper .swiper-button-next::after,
        .featured-slider-swiper .swiper-button-prev::after {
          font-size: 16px;
        }

        .featured-slider-swiper .swiper-pagination-bullet {
          background-color: rgba(79, 70, 229, 0.4);
          opacity: 1;
          width: 6px;
          height: 6px;
          margin: 0 2px;
        }

        .featured-slider-swiper .swiper-pagination-bullet-active {
          background-color: rgba(79, 70, 229, 1);
        }

        @media (min-width: 768px) {
          .featured-slider-swiper .swiper-button-next,
          .featured-slider-swiper .swiper-button-prev {
            display: flex;
            width: 36px;
            height: 36px;
          }

          .featured-slider-swiper .swiper-button-next::after,
          .featured-slider-swiper .swiper-button-prev::after {
            font-size: 18px;
          }
        }

        @media (min-width: 1024px) {
          .featured-slider-swiper .swiper-button-next,
          .featured-slider-swiper .swiper-button-prev {
            width: 40px;
            height: 40px;
          }

          .featured-slider-swiper .swiper-button-next::after,
          .featured-slider-swiper .swiper-button-prev::after {
            font-size: 20px;
          }
        }

        .featured-slider-swiper .swiper-pagination {
          padding: 8px 0 0 0;
        }
      `}</style>
    </section>
  );
}
