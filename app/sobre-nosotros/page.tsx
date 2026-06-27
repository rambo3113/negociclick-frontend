import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Sobre Nosotros · NegociClick',
  description: 'Conoce el equipo y la misión detrás de NegociClick, el marketplace de servicios #1 en Lima, Perú.',
};

const VALUES = [
  { emoji: '🎯', title: 'Simplicidad', desc: 'Reservar un servicio debe tomar menos de un minuto. Diseñamos cada pantalla pensando en eso.', color: 'group-hover:bg-indigo-50 group-hover:border-indigo-200' },
  { emoji: '🤝', title: 'Confianza', desc: 'Verificamos negocios y protegemos los datos de cada usuario bajo la Ley N° 29733 del Perú.', color: 'group-hover:bg-green-50 group-hover:border-green-200' },
  { emoji: '🚀', title: 'Crecimiento', desc: 'Queremos que cada negocio en NegociClick tenga más clientes el mes que viene que el anterior.', color: 'group-hover:bg-purple-50 group-hover:border-purple-200' },
  { emoji: '🌎', title: 'Local primero', desc: 'Nacemos en Lima para apoyar al emprendedor peruano. Todo el equipo y la operación está aquí.', color: 'group-hover:bg-amber-50 group-hover:border-amber-200' },
];

const STATS = [
  { value: '27+', label: 'Categorías de servicio', icon: '📂' },
  { value: '100%', label: 'Online · Sin llamadas', icon: '📱' },
  { value: '3 min', label: 'Para publicar tu negocio', icon: '⚡' },
  { value: 'S/ 0', label: 'Para empezar (plan Free)', icon: '🎁' },
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-80"><Logo /></Link>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors hover:underline underline-offset-2">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-14">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide hover:bg-indigo-200 transition-colors cursor-default">
            Sobre nosotros
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
            Conectamos Lima con sus<br className="hidden sm:block" /> mejores servicios
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            NegociClick nació con una idea simple: que encontrar y reservar un servicio de calidad
            en Lima sea tan fácil como pedir un taxi desde tu teléfono.
          </p>
        </div>

        {/* Misión */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 rounded-3xl p-8 sm:p-12 text-white mb-10 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-3">Nuestra misión</p>
          <h2 className="text-2xl sm:text-3xl font-black mb-4 leading-snug">
            Digitalizar los negocios de servicio del Perú, uno a uno.
          </h2>
          <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
            Millones de peruanos buscan servicios de salud, bienestar, belleza y más cada semana.
            La mayoría llama por teléfono, escribe por WhatsApp o simplemente aparece sin cita.
            NegociClick cambia eso: agenda online, pagos seguros y cero llamadas para el cliente;
            más reservas, menos trabajo manual y datos reales para el negocio.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {STATS.map(s => (
            <div
              key={s.label}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 hover:bg-indigo-50 transition-all duration-200 cursor-default group"
            >
              <div className="text-xl mb-1 group-hover:scale-125 transition-transform duration-200">{s.icon}</div>
              <p className="text-2xl font-black text-indigo-600 mb-1">{s.value}</p>
              <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Valores */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-6">Lo que nos guía</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map(v => (
              <div
                key={v.title}
                className={`group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 ${v.color}`}
              >
                <div className="text-2xl mb-3 group-hover:scale-125 transition-transform duration-200 inline-block">{v.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historia */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm mb-10 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200">
          <h2 className="text-xl font-black text-gray-900 mb-4">Cómo empezó</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              NegociClick nació en Lima en 2026 al notar que los negocios de servicio —barberías,
              consultorios, spas, gimnasios— seguían gestionando sus citas en libretas o grupos de
              WhatsApp, mientras sus clientes no encontraban una forma fácil de reservar sin llamar.
            </p>
            <p>
              Decidimos construir la solución: un marketplace donde cualquier negocio pueda publicar
              sus servicios en minutos y cualquier cliente pueda reservar en segundos, con pagos
              seguros integrados y sin complicaciones.
            </p>
            <p>
              Operamos 100% desde Lima y creemos que el emprendedor peruano merece las mismas
              herramientas tecnológicas que cualquier negocio en el mundo.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 hover:bg-gray-800 rounded-3xl p-8 text-center text-white transition-colors duration-300 hover:shadow-2xl hover:shadow-gray-400">
          <h2 className="text-xl font-black mb-2">¿Tienes un negocio de servicios?</h2>
          <p className="text-white/60 text-sm mb-6">Publica gratis en NegociClick y empieza a recibir reservas online hoy mismo.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40">
              Registrar mi negocio
            </Link>
            <Link href="/soporte"
              className="border border-white/20 hover:border-white hover:bg-white/10 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5">
              Tengo una pregunta
            </Link>
          </div>
        </div>

      </main>

      <footer className="border-t border-gray-200 mt-12 py-6 text-center">
        <p className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-default">© 2026 NegociClick · Lima, Perú</p>
      </footer>
    </div>
  );
}
