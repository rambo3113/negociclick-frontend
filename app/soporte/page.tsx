import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Soporte · NegociClick',
  description: 'Centro de ayuda de NegociClick. Preguntas frecuentes, contacto por WhatsApp y correo.',
};

const FAQS_CLIENTES = [
  {
    q: '¿Cómo reservo un servicio?',
    a: 'Busca el negocio en la página de inicio, entra a su perfil, elige el servicio y el horario disponible, y confirma tu reserva. Recibirás un correo de confirmación.',
  },
  {
    q: '¿Puedo cancelar mi reserva?',
    a: 'Sí. Ve a la sección "Mis reservas" desde tu cuenta, localiza la reserva y selecciona "Cancelar". Te recomendamos cancelar con al menos 24 horas de anticipación.',
  },
  {
    q: '¿Cómo pago mis reservas?',
    a: 'El pago depende de cada negocio. Algunos cobran en el local, otros habilitan el pago online con tarjeta a través de Culqi (Visa, Mastercard, Amex, Diners).',
  },
  {
    q: '¿Es seguro pagar en NegociClick?',
    a: 'Sí. Los pagos online son procesados por Culqi, una pasarela peruana certificada PCI-DSS. NegociClick nunca almacena los datos de tu tarjeta.',
  },
  {
    q: '¿Necesito crear una cuenta para reservar?',
    a: 'Sí, necesitas registrarte como cliente (es gratis y toma menos de 1 minuto). Esto nos permite enviarte confirmaciones y proteger tu información.',
  },
];

const FAQS_NEGOCIOS = [
  {
    q: '¿Cuánto cuesta publicar mi negocio?',
    a: 'El plan Free es totalmente gratuito y te permite publicar hasta 5 servicios. Los planes PRO (S/ 29.99/mes) y PREMIUM (S/ 79.99/mes) desbloquean más servicios, visibilidad y herramientas.',
  },
  {
    q: '¿Cómo activo mi negocio en la plataforma?',
    a: 'Regístrate como "Negocio", completa el perfil con nombre, categoría, descripción y foto, y añade tus servicios con precio y duración. Tu negocio queda visible de inmediato.',
  },
  {
    q: '¿Cómo gestiono mis reservas?',
    a: 'Desde tu dashboard verás todas las reservas entrantes. Puedes confirmarlas, cancelarlas o reprogramarlas. También recibirás notificaciones por correo.',
  },
  {
    q: '¿Puedo recibir pagos online?',
    a: 'Sí, con los planes PRO y PREMIUM puedes activar el cobro online mediante Culqi. Los fondos se transfieren a tu cuenta bancaria directamente por Culqi.',
  },
  {
    q: '¿Puedo cambiar o cancelar mi plan?',
    a: 'Sí. Desde la sección "Suscripción" en tu dashboard puedes cambiar de plan o cancelar en cualquier momento. Al cancelar vuelves al plan Free sin perder tu historial.',
  },
  {
    q: '¿Qué pasa si tengo más de 5 servicios en Free?',
    a: 'El plan Free permite hasta 5 servicios activos. Si superas ese límite, deberás subir a PRO o PREMIUM para activar los servicios adicionales.',
  },
];

export default function SoportePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity"><Logo /></Link>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors hover:underline underline-offset-2">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Centro de ayuda
          </span>
          <h1 className="text-4xl font-black text-gray-900 mb-3">¿En qué podemos ayudarte?</h1>
          <p className="text-gray-500 text-sm">Encuentra respuestas rápidas o escríbenos directamente.</p>
        </div>

        {/* Contacto directo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          <a
            href="https://wa.me/51984151452?text=Hola%2C%20necesito%20ayuda%20con%20NegociClick"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-5 hover:bg-green-100 transition group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-800 text-sm">WhatsApp</p>
              <p className="text-green-600 text-xs mt-0.5">+51 984 151 452</p>
              <p className="text-green-500 text-xs">Respuesta en minutos</p>
            </div>
          </a>

          <a
            href="mailto:negociclick2026@gmail.com?subject=Consulta%20NegociClick"
            className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 hover:bg-indigo-100 transition group"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-indigo-800 text-sm">Correo electrónico</p>
              <p className="text-indigo-600 text-xs mt-0.5">negociclick2026@gmail.com</p>
              <p className="text-indigo-400 text-xs">Respuesta en menos de 24 h</p>
            </div>
          </a>
        </div>

        {/* FAQ Clientes */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-base">👤</div>
            <h2 className="text-lg font-black text-gray-900">Para clientes</h2>
          </div>
          <div className="space-y-3">
            {FAQS_CLIENTES.map((faq, i) => (
              <details key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm group hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 open:border-blue-300 open:shadow-md">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-sm text-gray-800 flex items-center justify-between list-none select-none hover:text-blue-600 group-open:text-blue-600 transition-colors">
                  {faq.q}
                  <span className="text-gray-300 group-open:rotate-180 group-open:text-blue-400 transition-all duration-200 flex-shrink-0 ml-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-blue-50 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* FAQ Negocios */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-base">🏪</div>
            <h2 className="text-lg font-black text-gray-900">Para negocios</h2>
          </div>
          <div className="space-y-3">
            {FAQS_NEGOCIOS.map((faq, i) => (
              <details key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm group hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200 open:border-purple-300 open:shadow-md">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-sm text-gray-800 flex items-center justify-between list-none select-none hover:text-purple-600 group-open:text-purple-600 transition-colors">
                  {faq.q}
                  <span className="text-gray-300 group-open:rotate-180 group-open:text-purple-400 transition-all duration-200 flex-shrink-0 ml-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-purple-50 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-gray-900 hover:bg-gray-800 rounded-3xl p-8 text-center text-white transition-colors duration-300 hover:shadow-2xl hover:shadow-gray-400">
          <p className="text-2xl mb-2">💬</p>
          <h2 className="text-lg font-black mb-2">¿No encontraste tu respuesta?</h2>
          <p className="text-white/50 text-sm mb-6">Escríbenos por WhatsApp y te respondemos en minutos.</p>
          <a
            href="https://wa.me/51984151452?text=Hola%2C%20tengo%20una%20consulta%20sobre%20NegociClick"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/40"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Escribir por WhatsApp
          </a>
        </div>

      </main>

      <footer className="border-t border-gray-200 mt-12 py-6 text-center">
        <p className="text-xs text-gray-400">© 2026 NegociClick · Lima, Perú</p>
      </footer>
    </div>
  );
}
