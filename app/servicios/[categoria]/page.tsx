import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmptyState from '@/components/EmptyState';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://negociclick.pe';

// Mapa de slug URL → categoría BD + metadata SEO
const CATEGORIA_MAP: Record<string, {
  key: string;
  label: string;
  emoji: string;
  h1: string;
  description: string;
  keywords: string[];
}> = {
  'barberia-lima':            { key: 'BARBERIA',          emoji: '✂️',  label: 'Barberías',             h1: 'Las mejores barberías en Lima',            description: 'Encuentra barberías en Lima con reserva online. Corte, barba y más. Agenda tu cita en segundos.',               keywords: ['barbería Lima', 'barber Lima', 'corte de cabello Lima', 'reservar barbería Lima'] },
  'spa-lima':                 { key: 'SPA',               emoji: '🌿',  label: 'Spas',                  h1: 'Los mejores spas en Lima',                 description: 'Reserva sesiones de spa en Lima: masajes, faciales, aromaterapia y más. Relajación garantizada.',               keywords: ['spa Lima', 'masajes Lima', 'centro de relajación Lima', 'reservar spa Lima'] },
  'salon-belleza-lima':       { key: 'SALON_BELLEZA',     emoji: '💅',  label: 'Salones de Belleza',    h1: 'Salones de belleza en Lima',               description: 'Agenda citas en los mejores salones de belleza de Lima. Corte, tinte, manicure y más.',                          keywords: ['salón de belleza Lima', 'peluquería Lima', 'manicure Lima', 'tinte de cabello Lima'] },
  'dentista-lima':            { key: 'ODONTOLOGIA',       emoji: '🦷',  label: 'Dentistas',             h1: 'Dentistas y clínicas dentales en Lima',    description: 'Reserva cita con dentistas en Lima. Limpieza dental, blanqueamiento, ortodoncia y más.',                        keywords: ['dentista Lima', 'odontólogo Lima', 'clínica dental Lima', 'limpieza dental Lima'] },
  'veterinaria-lima':         { key: 'VETERINARIA',       emoji: '🐾',  label: 'Veterinarias',          h1: 'Veterinarias en Lima',                     description: 'Encuentra veterinarias en Lima. Consultas, vacunas, cirugías y atención de emergencia para tu mascota.',       keywords: ['veterinaria Lima', 'veterinario Lima', 'clínica veterinaria Lima'] },
  'gimnasio-lima':            { key: 'GIMNASIO',          emoji: '🏋️', label: 'Gimnasios',             h1: 'Gimnasios y centros fitness en Lima',       description: 'Reserva clases en los mejores gimnasios de Lima. Crossfit, yoga, pilates, musculación y más.',                 keywords: ['gimnasio Lima', 'gym Lima', 'fitness Lima', 'clases de yoga Lima'] },
  'psicologo-lima':           { key: 'PSICOLOGO',         emoji: '🧠',  label: 'Psicólogos',            h1: 'Psicólogos y terapistas en Lima',          description: 'Agenda consultas con psicólogos en Lima. Terapia individual, de pareja y familiar.',                            keywords: ['psicólogo Lima', 'terapeuta Lima', 'terapia psicológica Lima', 'salud mental Lima'] },
  'nutricionista-lima':       { key: 'NUTRICIONISTA',     emoji: '🥗',  label: 'Nutricionistas',        h1: 'Nutricionistas en Lima',                   description: 'Reserva consulta con nutricionistas en Lima. Planes alimenticios, dieta y bienestar.',                          keywords: ['nutricionista Lima', 'dietista Lima', 'plan nutricional Lima'] },
  'tatuajes-lima':            { key: 'TATUAJES',          emoji: '🎨',  label: 'Tatuadores',            h1: 'Estudios de tatuajes y piercings en Lima', description: 'Encuentra tatuadores profesionales en Lima. Tatuajes personalizados y piercings en estudios seguros.',           keywords: ['tatuajes Lima', 'estudio de tatuajes Lima', 'piercing Lima'] },
  'fisioterapia-lima':        { key: 'FISIOTERAPIA',      emoji: '🦺',  label: 'Fisioterapeutas',       h1: 'Fisioterapia y rehabilitación en Lima',    description: 'Reserva sesiones de fisioterapia en Lima. Rehabilitación, masajes terapéuticos y más.',                        keywords: ['fisioterapia Lima', 'fisioterapeuta Lima', 'rehabilitación Lima'] },
  'micropigmentacion-lima':   { key: 'MICROPIGMENTACION', emoji: '🖌️', label: 'Micropigmentación',     h1: 'Micropigmentación en Lima',                description: 'Agenda sesiones de micropigmentación en Lima. Cejas, labios y delineado permanente con profesionales.',        keywords: ['micropigmentación Lima', 'cejas permanentes Lima', 'maquillaje permanente Lima'] },
  'maquillaje-lima':          { key: 'MAQUILLAJE',        emoji: '💄',  label: 'Maquilladores',         h1: 'Maquilladores profesionales en Lima',       description: 'Reserva con maquilladores profesionales en Lima para eventos, bodas, quinceañeras y más.',                     keywords: ['maquillaje Lima', 'maquillador Lima', 'maquillaje para eventos Lima'] },
  'depilacion-lima':          { key: 'DEPILACION',        emoji: '🪒',  label: 'Depilación',            h1: 'Centros de depilación en Lima',            description: 'Encuentra centros de depilación en Lima. Cera, láser y más técnicas con profesionales certificados.',           keywords: ['depilación Lima', 'depilación láser Lima', 'depilación con cera Lima'] },
  'masajes-domicilio-lima':   { key: 'MASAJES_DOMICILIO', emoji: '💆',  label: 'Masajes a Domicilio',   h1: 'Masajes a domicilio en Lima',              description: 'Reserva masajes a domicilio en Lima. Relajantes, terapéuticos y descontracturantes donde estés.',              keywords: ['masajes a domicilio Lima', 'masajista Lima', 'masaje relajante Lima'] },
  'nail-art-lima':            { key: 'NAIL_ART',          emoji: '💅',  label: 'Nail Art',              h1: 'Nail art y uñas en Lima',                  description: 'Reserva con nail artists en Lima. Diseño de uñas, semipermanente, acrílicas y más.',                           keywords: ['nail art Lima', 'manicure Lima', 'uñas Lima', 'nail artist Lima'] },
  'peluqueria-canina-lima':   { key: 'PELUQUERIA_CANINA', emoji: '🐕',  label: 'Peluquería Canina',     h1: 'Peluquerías caninas en Lima',              description: 'Agenda baño y corte para tu perro en Lima. Peluquerías caninas con profesionales especializados.',              keywords: ['peluquería canina Lima', 'baño y corte perro Lima', 'grooming Lima'] },
  'electricista-lima':        { key: 'ELECTRICIDAD',      emoji: '⚡',  label: 'Electricistas',         h1: 'Electricistas en Lima',                    description: 'Encuentra electricistas en Lima. Instalaciones, reparaciones y emergencias eléctricas.',                        keywords: ['electricista Lima', 'electricidad Lima', 'instalación eléctrica Lima'] },
  'gasfitero-lima':           { key: 'GASFITERIA',        emoji: '🔧',  label: 'Gasfiteros',            h1: 'Gasfiteros en Lima',                       description: 'Reserva gasfiteros en Lima para reparaciones, instalaciones y emergencias de agua y gas.',                     keywords: ['gasfitero Lima', 'gasfitería Lima', 'plomero Lima', 'reparaciones Lima'] },
  'jardineria-lima':          { key: 'JARDINERIA',        emoji: '🌱',  label: 'Jardineros',            h1: 'Jardineros en Lima',                       description: 'Encuentra jardineros y servicios de jardinería en Lima para tu casa o empresa.',                                keywords: ['jardinero Lima', 'jardinería Lima', 'mantenimiento jardín Lima'] },
  'limpieza-hogar-lima':      { key: 'LIMPIEZA_HOGAR',   emoji: '🧹',  label: 'Limpieza del Hogar',    h1: 'Servicios de limpieza del hogar en Lima',  description: 'Reserva servicios de limpieza para tu hogar en Lima. Limpieza profunda, mantenimiento y más.',                 keywords: ['limpieza hogar Lima', 'servicio de limpieza Lima', 'limpieza de casa Lima'] },
  'reposteria-lima':          { key: 'REPOSTERIA',        emoji: '🎂',  label: 'Repostería',            h1: 'Reposteros y pastelerías en Lima',         description: 'Pide tortas, cupcakes y más a reposteros en Lima. Pedidos personalizados para eventos y cumpleaños.',           keywords: ['repostería Lima', 'tortas Lima', 'pastelería Lima', 'cupcakes Lima'] },
  'catering-lima':            { key: 'CATERING',          emoji: '🍽️', label: 'Catering',              h1: 'Catering y chefs a domicilio en Lima',     description: 'Contrata servicios de catering y chefs a domicilio en Lima para eventos, reuniones y más.',                    keywords: ['catering Lima', 'chef Lima', 'chef a domicilio Lima', 'catering eventos Lima'] },
  'clases-particulares-lima': { key: 'CLASES_PARTICULARES', emoji: '📚', label: 'Clases Particulares', h1: 'Clases particulares en Lima',              description: 'Encuentra profesores particulares en Lima. Matemáticas, inglés, música y más materias.',                        keywords: ['clases particulares Lima', 'profesor particular Lima', 'tutorías Lima'] },
};

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  averageRating: number | null;
  totalReviews: number;
  description?: string;
  coverImage?: string | null;
  featured?: boolean;
  minPrice?: number | null;
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIA_MAP).map(slug => ({ categoria: slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ categoria: string }> }
): Promise<Metadata> {
  const { categoria } = await params;
  const meta = CATEGORIA_MAP[categoria];
  if (!meta) return { title: 'Servicios en Lima — NegociClick' };

  return {
    title: `${meta.h1} | NegociClick`,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: `${meta.h1} | NegociClick`,
      description: meta.description,
      type: 'website',
      locale: 'es_PE',
      siteName: 'NegociClick',
      url: `${BASE}/servicios/${categoria}`,
    },
    alternates: { canonical: `${BASE}/servicios/${categoria}` },
  };
}

async function getBusinesses(categoryKey: string): Promise<Business[]> {
  try {
    const res = await fetch(
      `${API}/businesses?category=${categoryKey}&limit=50`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.businesses ?? [];
  } catch {
    return [];
  }
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function CategoriaPage(
  { params }: { params: Promise<{ categoria: string }> }
) {
  const { categoria } = await params;
  const meta = CATEGORIA_MAP[categoria];

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Categoría no encontrada</p>
            <Link href="/" className="text-indigo-600 underline">Volver al inicio</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const businesses = await getBusinesses(meta.key);

  // JSON-LD Schema.org para SEO local
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: meta.h1,
    description: meta.description,
    url: `${BASE}/servicios/${categoria}`,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 10).map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: b.name,
        description: b.description,
        address: { '@type': 'PostalAddress', addressLocality: b.city, addressCountry: 'PE' },
        url: `${BASE}/businesses/${b.id}`,
        ...(b.averageRating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: b.averageRating, reviewCount: b.totalReviews } } : {}),
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">{meta.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{meta.h1}</h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto">{meta.description}</p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {meta.keywords.slice(0, 3).map(kw => (
              <span key={kw} className="bg-white/15 text-white text-sm px-3 py-1 rounded-full">{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600 transition">Inicio</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{meta.label}</span>
          {businesses.length > 0 && <span className="ml-auto text-xs text-gray-500">{businesses.length} negocio{businesses.length !== 1 ? 's' : ''} encontrado{businesses.length !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Listado */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {businesses.length === 0 ? (
          <EmptyState
            emoji={meta.emoji}
            title={`¿Tienes un negocio de ${meta.label.toLowerCase()}?`}
            description={`Aún no hay ${meta.label.toLowerCase()} registrados en NegociClick. Sé el primero en publicar y empieza a recibir reservas hoy mismo, gratis.`}
            cta={{ label: 'Publicar mi negocio gratis →', href: '/register?role=VENDOR' }}
          >
            <Link
              href="/"
              className="block text-sm text-indigo-600 hover:underline mt-2"
            >
              ← Explorar otras categorías
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map(biz => (
                <Link
                  key={biz.id}
                  href={`/businesses/${biz.id}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  {/* Cover */}
                  <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                    {biz.coverImage ? (
                      <Image
                        src={biz.coverImage}
                        alt={biz.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">{meta.emoji}</div>
                    )}
                    {biz.featured && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Destacado</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-indigo-700 transition-colors">{biz.name}</h2>
                    <p className="text-xs text-gray-500 mb-2">{biz.city}</p>

                    {biz.averageRating !== null && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <StarRow rating={biz.averageRating} />
                        <span className="text-xs text-gray-500">{biz.averageRating.toFixed(1)} ({biz.totalReviews})</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {biz.minPrice !== null && biz.minPrice !== undefined ? (
                        <span className="text-xs text-gray-500">Desde <strong className="text-gray-800">S/ {Number(biz.minPrice).toFixed(2)}</strong></span>
                      ) : <span />}
                      <span className="text-xs font-semibold text-indigo-600 group-hover:underline">Reservar →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA Registro vendor */}
            <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">{meta.emoji}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Tienes un negocio de {meta.label.toLowerCase()}?</h3>
              <p className="text-sm text-gray-600 mb-5">Únete a NegociClick y empieza a recibir reservas online hoy mismo. Registro gratuito.</p>
              <Link
                href="/register?role=VENDOR"
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition"
              >
                Registrar mi negocio gratis →
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
