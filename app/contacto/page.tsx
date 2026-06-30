import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contáctanos por email, WhatsApp o visítanos en Lima, Perú. Estamos disponibles para ayudarte.',
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-black mb-2">Contáctanos</h1>
          <p className="text-indigo-200">Estamos aquí para ayudarte. Escríbenos y te respondemos lo antes posible.</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Info de contacto */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Información de contacto</h2>

            {[
              {
                Icon: Mail,
                title: 'Correo electrónico',
                value: 'noreply@negociclick.com',
                href: 'mailto:noreply@negociclick.com',
                color: 'bg-indigo-100 text-indigo-600',
              },
              {
                Icon: MessageCircle,
                title: 'WhatsApp',
                value: '+51 999 999 999',
                href: 'https://wa.me/51999999999',
                color: 'bg-green-100 text-green-600',
              },
              {
                Icon: Phone,
                title: 'Teléfono',
                value: '+51 999 999 999',
                href: 'tel:+51999999999',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                Icon: MapPin,
                title: 'Ubicación',
                value: 'Lima, Perú',
                href: null,
                color: 'bg-red-100 text-red-600',
              },
              {
                Icon: Clock,
                title: 'Horario de atención',
                value: 'Lunes a Viernes, 9:00 AM – 6:00 PM',
                href: null,
                color: 'bg-amber-100 text-amber-600',
              },
            ].map(({ Icon, title, value, href, color }) => (
              <div key={title} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{title}</p>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Card informativa */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 mb-6">¿En qué podemos ayudarte?</h2>

            {[
              { emoji: '🏪', title: 'Para negocios', desc: 'Dudas sobre cómo publicar tu negocio, planes de suscripción o cómo recibir reservas.' },
              { emoji: '📅', title: 'Para clientes', desc: 'Problemas con una reserva, pagos, cancelaciones o cualquier consulta sobre el servicio.' },
              { emoji: '💳', title: 'Pagos y facturación', desc: 'Consultas sobre cobros, reembolsos o comprobantes de pago.' },
              { emoji: '⚠️', title: 'Reclamos formales', desc: 'Para presentar un reclamo formal según la normativa del INDECOPI, usa nuestro Libro de Reclamaciones.', link: '/reclamos', linkLabel: 'Ir al Libro de Reclamaciones' },
            ].map(({ emoji, title, desc, link, linkLabel }) => (
              <div key={title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                    <p className="text-gray-500 text-sm">{desc}</p>
                    {link && (
                      <a href={link} className="inline-block mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                        {linkLabel} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
