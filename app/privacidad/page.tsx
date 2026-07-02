import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
  alternates: { canonical: '/privacidad' },
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
    content: 'Usamos cookies de sesión estrictamente necesarias para el funcionamiento de la plataforma (autenticación y preferencias). Adicionalmente, usamos Google Analytics (GA4) para analítica anónima del tráfico — puedes rechazar estas cookies no esenciales desde el banner de cookies que aparece en tu primera visita. No usamos cookies de publicidad personalizada.',
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
    num: '03', title: 'Finalidad y base legal del tratamiento',
    intro: 'Tratamos tus datos con las siguientes finalidades y bases legales:',
    items: [
      'Gestionar tu cuenta y autenticación — base legal: ejecución del contrato (Art. 13 Ley 29733).',
      'Procesar y gestionar reservas entre clientes y vendors — base legal: ejecución del contrato.',
      'Enviar notificaciones relacionadas a tus reservas y cuenta — base legal: ejecución del contrato.',
      'Mejorar la plataforma y prevenir fraudes — base legal: interés legítimo del responsable.',
      'Cumplir con obligaciones legales tributarias y regulatorias — base legal: obligación legal.',
      'Tratamiento de datos de pago a través de Culqi — base legal: ejecución del contrato.',
    ],
  },
  {
    num: '04', title: 'Compartición de datos',
    intro: 'Compartimos datos únicamente con:',
    items: [
      'Culqi — procesador de pagos (PCI-DSS compliant).',
      'Neon (PostgreSQL) — almacenamiento de base de datos en servidores en Sudamérica (São Paulo, Brasil).',
      'Cloudinary — almacenamiento de imágenes (fotos de perfil, negocios y servicios) en servidores en EE.UU.',
      'Vercel — alojamiento del frontend (negociclick.com) en servidores en EE.UU. y Europa.',
      'Railway — alojamiento del backend API en servidores en EE.UU.',
      'Vendors de NegociClick — reciben nombre y datos de contacto del cliente al confirmar una reserva.',
    ],
    note: 'No vendemos tus datos a terceros.',
  },
  {
    num: '06', title: 'Tus derechos (ARCO)',
    intro: 'Conforme a la Ley N° 29733, tienes derecho a:',
    items: [
      'Acceso — conocer qué datos personales tenemos sobre ti.',
      'Rectificación — corregir datos inexactos o incompletos.',
      'Cancelación — solicitar la eliminación de tus datos cuando ya no sean necesarios.',
      'Oposición — oponerte al tratamiento de tus datos en determinadas circunstancias.',
    ],
    note: 'Ejerce tus derechos escribiendo a privacidad@negociclick.com. Respondemos en un plazo máximo de 20 días hábiles conforme a la ley.',
  },
  {
    num: '06b', title: 'Transferencias internacionales de datos',
    intro: 'NegociClick utiliza servicios de terceros que pueden almacenar o procesar tus datos fuera de Perú:',
    items: [
      'Vercel Inc. (EE.UU.) — hosting del frontend. Sujeto a sus políticas de privacidad y marcos de adecuación aplicables.',
      'Railway Corp. (EE.UU.) — hosting del backend API.',
      'Cloudinary Ltd. (EE.UU.) — almacenamiento de imágenes.',
      'Neon Inc. (EE.UU./Brasil) — base de datos PostgreSQL.',
      'Culqi (Perú) — procesador de pagos PCI-DSS, opera bajo regulación SBS de Perú.',
    ],
    note: 'Al registrarte en NegociClick, consientes expresamente estas transferencias internacionales, que son necesarias para operar el servicio.',
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
            href="mailto:privacidad@negociclick.com"
            className="group flex items-start gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="text-xs font-black text-indigo-300 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0 w-6">10</span>
            <div>
              <h2 className="text-sm font-bold text-indigo-900 mb-1 group-hover:text-indigo-700 transition-colors">Contacto</h2>
              <p className="text-sm text-indigo-600 leading-relaxed">
                Para consultas sobre privacidad:{' '}
                <span className="font-semibold underline underline-offset-2">privacidad@negociclick.com</span>
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
