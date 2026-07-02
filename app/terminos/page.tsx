import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  alternates: { canonical: '/terminos' },
  title: 'Términos y Condiciones · NegociClick',
  description: 'Términos y condiciones de uso de la plataforma NegociClick.',
  keywords: ['términos y condiciones NegociClick', 'condiciones uso marketplace Lima', 'NegociClick legal'],
};

const SECTIONS = [
  {
    num: '01', title: 'Aceptación de los términos',
    content: 'Al registrarte y usar NegociClick, aceptas estos Términos y Condiciones. Si no estás de acuerdo, no uses la plataforma. NegociClick es operada desde Lima, Perú.',
  },
  {
    num: '02', title: 'Descripción del servicio',
    content: 'NegociClick es una plataforma que conecta clientes con proveedores de servicios (vendors) en Lima, Perú. No somos proveedores del servicio final; actuamos como intermediarios facilitando la reserva y, en el plan PREMIUM, el cobro en línea mediante Culqi.',
  },
  {
    num: '03', title: 'Registro y cuenta',
    content: 'Debes proporcionar información verídica al registrarte. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta. Notifícanos de inmediato ante cualquier uso no autorizado.',
  },
  {
    num: '06', title: 'Pagos y reembolsos',
    content: 'Los pagos en línea son procesados por Culqi. Los planes de suscripción (PRO y PREMIUM) se cobran mensualmente. Las cancelaciones de reservas pagas están sujetas a la política de reembolso del vendor. NegociClick no garantiza reembolsos en disputas entre clientes y vendors.',
  },
  {
    num: '07', title: 'Conducta prohibida',
    content: 'Está prohibido: publicar información falsa o engañosa, acosar a otros usuarios, intentar eludir los sistemas de pago de la plataforma, o usar NegociClick para actividades ilegales.',
  },
  {
    num: '08', title: 'Limitación de responsabilidad',
    content: 'NegociClick no es responsable por la calidad del servicio prestado por los vendors, ni por daños directos o indirectos derivados del uso de la plataforma. La responsabilidad máxima de NegociClick no excederá el monto que hayas pagado en los últimos 3 meses.',
  },
  {
    num: '09', title: 'Modificaciones',
    content: 'Podemos actualizar estos términos en cualquier momento. Te notificaremos por correo electrónico ante cambios significativos. El uso continuado de la plataforma después de los cambios implica su aceptación.',
  },
];

const LIST_SECTIONS = [
  {
    num: '04', title: 'Obligaciones del vendor',
    items: [
      'Proporcionar información veraz sobre tus servicios, precios y horarios.',
      'Atender las reservas confirmadas en la fecha y hora pactadas.',
      'Notificar con anticipación ante cancelaciones o cambios.',
      'Cumplir con las leyes peruanas aplicables a tu actividad.',
    ],
  },
  {
    num: '05', title: 'Obligaciones del cliente',
    items: [
      'Asistir puntualmente a las citas reservadas.',
      'Cancelar con la anticipación suficiente si no puedes asistir.',
      'Realizar reseñas honestas y respetuosas.',
    ],
  },
];

export default function TerminosPage() {
  const allSections = [
    ...SECTIONS.slice(0, 3),
    ...LIST_SECTIONS,
    ...SECTIONS.slice(3),
  ].sort((a, b) => a.num.localeCompare(b.num));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-4 py-10 flex-1">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-400 mb-8">Última actualización: junio de 2026</p>

        <div className="space-y-3">
          {allSections.map(s => (
            <div
              key={s.num}
              className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              <div className="flex items-start gap-4">
                <span className="text-xs font-black text-indigo-300 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0 w-6">
                  {s.num}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                    {s.title}
                  </h2>
                  {'content' in s ? (
                    <p className="text-sm text-gray-500 leading-relaxed">{s.content}</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {(s as any).items.map((item: string) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                          <span className="text-indigo-300 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0">›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Contacto */}
          <a
            href="mailto:noreply@negociclick.com"
            className="group flex items-start gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="text-xs font-black text-indigo-300 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0 w-6">10</span>
            <div>
              <h2 className="text-sm font-bold text-indigo-900 mb-1 group-hover:text-indigo-700 transition-colors">Contacto</h2>
              <p className="text-sm text-indigo-600 leading-relaxed">
                Para consultas sobre estos términos, escríbenos a{' '}
                <span className="font-semibold underline underline-offset-2">noreply@negociclick.com</span>
              </p>
            </div>
          </a>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-400">
          <Link href="/devoluciones" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Política de Devoluciones</Link>
          <Link href="/reclamos" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Libro de Reclamaciones</Link>
          <Link href="/contacto" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Contacto</Link>
          <Link href="/" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Volver al inicio</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
