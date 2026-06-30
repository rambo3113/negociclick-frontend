import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Política de Privacidad · NegociClick',
  description: 'Política de privacidad y tratamiento de datos personales de NegociClick.',
  keywords: ['política privacidad NegociClick', 'protección datos Lima', 'privacidad marketplace Perú'],
};

const SECTIONS = [
  {
    num: '01', title: 'Responsable del tratamiento',
    content: 'NegociClick, con operaciones en Lima, Perú, es responsable del tratamiento de tus datos personales conforme a la Ley N° 29733 — Ley de Protección de Datos Personales del Perú.',
  },
  {
    num: '05', title: 'Retención de datos',
    content: 'Conservamos tus datos mientras tu cuenta esté activa o sea necesario para cumplir obligaciones legales. Puedes solicitar la eliminación de tu cuenta escribiendo a nuestro correo de contacto.',
  },
  {
    num: '07', title: 'Seguridad',
    content: 'Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (HTTPS), contraseñas almacenadas con bcrypt, y acceso restringido a datos sensibles.',
  },
  {
    num: '08', title: 'Cookies',
    content: 'Usamos únicamente cookies de sesión necesarias para el funcionamiento de la plataforma. No usamos cookies de seguimiento ni publicidad.',
  },
  {
    num: '09', title: 'Cambios a esta política',
    content: 'Notificaremos por correo electrónico ante cambios significativos. La versión vigente siempre estará disponible en esta página.',
  },
];

const LIST_SECTIONS: { num: string; title: string; intro?: string; items: string[]; note?: string }[] = [
  {
    num: '02', title: 'Datos que recopilamos',
    items: [
      'Datos de cuenta: nombre, correo electrónico, teléfono.',
      'Datos de perfil: foto de avatar, descripción del negocio, fotos del negocio.',
      'Datos de reservas: servicio reservado, fecha, monto, notas.',
      'Datos de pago: procesados por Culqi. NegociClick no almacena datos de tarjeta.',
      'Datos técnicos: dirección IP, navegador, actividad en la plataforma.',
    ],
  },
  {
    num: '03', title: 'Finalidad del tratamiento',
    items: [
      'Gestionar tu cuenta y autenticación.',
      'Procesar y gestionar reservas entre clientes y vendors.',
      'Enviar notificaciones relacionadas a tus reservas y cuenta.',
      'Mejorar la plataforma y prevenir fraudes.',
      'Cumplir con obligaciones legales.',
    ],
  },
  {
    num: '04', title: 'Compartición de datos',
    intro: 'Compartimos datos únicamente con:',
    items: [
      'Culqi — procesador de pagos (PCI-DSS compliant).',
      'Neon (PostgreSQL) — almacenamiento de base de datos en servidores en Sudamérica.',
      'Vendors de NegociClick — reciben nombre y datos de contacto del cliente al confirmar una reserva.',
    ],
    note: 'No vendemos tus datos a terceros.',
  },
  {
    num: '06', title: 'Tus derechos',
    intro: 'Conforme a la Ley N° 29733, tienes derecho a:',
    items: [
      'Acceder a tus datos personales.',
      'Rectificar datos inexactos.',
      'Cancelar o eliminar tus datos.',
      'Oponerte al tratamiento de tus datos.',
    ],
    note: 'Ejerce tus derechos escribiendo a noreply@negociclick.com.',
  },
];

export default function PrivacidadPage() {
  const allSections = [...SECTIONS, ...LIST_SECTIONS].sort((a, b) => a.num.localeCompare(b.num));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity"><Logo /></Link>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors hover:underline underline-offset-2">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Política de Privacidad</h1>
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
                    <>
                      {(s as any).intro && (
                        <p className="text-sm text-gray-500 mb-2">{(s as any).intro}</p>
                      )}
                      <ul className="space-y-1.5">
                        {(s as any).items.map((item: string) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                            <span className="text-indigo-300 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0">›</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {(s as any).note && (
                        <p className="text-sm text-gray-500 mt-2 font-medium">{(s as any).note}</p>
                      )}
                    </>
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
                Para consultas sobre privacidad:{' '}
                <span className="font-semibold underline underline-offset-2">noreply@negociclick.com</span>
              </p>
            </div>
          </a>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-400">
          <Link href="/terminos" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Términos y Condiciones</Link>
          <Link href="/soporte" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Centro de ayuda</Link>
          <Link href="/" className="hover:text-indigo-600 hover:underline underline-offset-2 transition-colors">Volver al inicio</Link>
        </div>
      </main>
    </div>
  );
}
