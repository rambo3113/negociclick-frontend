import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Política de devoluciones',
  description: 'Conoce nuestra política de cancelaciones, reembolsos y devoluciones en NegociClick.',
};

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black mb-2">Política de devoluciones</h1>
          <p className="text-indigo-200 text-sm">Última actualización: 1 de junio de 2026</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto w-full px-4 py-10 flex-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">

          <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-indigo-400 pl-4 bg-indigo-50 py-3 pr-4 rounded-r-xl">
            En NegociClick nos importa tu satisfacción. Esta política describe los casos en que aplican cancelaciones y reembolsos, tanto para clientes como para proveedores de servicios.
          </p>

          {[
            {
              title: '1. Cancelaciones por parte del cliente',
              content: `El cliente puede cancelar una reserva directamente desde la plataforma. Las condiciones de reembolso dependen de la anticipación con que se realice la cancelación:`,
              items: [
                'Cancelación con más de 24 horas de anticipación: reembolso del 100% del monto pagado.',
                'Cancelación entre 12 y 24 horas antes: reembolso del 50% del monto pagado.',
                'Cancelación con menos de 12 horas de anticipación o inasistencia: no aplica reembolso.',
              ],
            },
            {
              title: '2. Cancelaciones por parte del proveedor (Vendor)',
              content: `Si el proveedor del servicio cancela una reserva confirmada, el cliente recibirá un reembolso del 100% del monto pagado, procesado en un plazo de 5 a 10 días hábiles según el banco emisor de la tarjeta.`,
            },
            {
              title: '3. Proceso de solicitud de reembolso',
              content: `Para solicitar un reembolso, el cliente debe:`,
              items: [
                'Cancelar la reserva desde la sección "Mis reservas" en la plataforma.',
                'En caso de inconvenientes, contactar a NegociClick en negociclick2026@gmail.com indicando el número de reserva.',
                'El reembolso será procesado al mismo método de pago utilizado en la reserva original.',
                'El tiempo de acreditación es de 5 a 10 días hábiles según la entidad bancaria.',
              ],
            },
            {
              title: '4. Suscripciones de negocios (planes PRO y PREMIUM)',
              content: `Los planes de suscripción para proveedores tienen la siguiente política:`,
              items: [
                'Los pagos de suscripción no son reembolsables una vez activado el plan.',
                'El vendor puede cancelar su suscripción en cualquier momento; el plan permanecerá activo hasta la fecha de vencimiento del período pagado.',
                'En caso de error técnico o cobro duplicado comprobado, se procesará el reembolso correspondiente dentro de los 5 días hábiles siguientes.',
                'NegociClick se reserva el derecho de evaluar casos excepcionales de manera individual.',
              ],
            },
            {
              title: '5. Servicios no satisfactorios',
              content: `NegociClick actúa como plataforma de intermediación y no presta directamente los servicios. Si un cliente no queda satisfecho con la calidad del servicio recibido, puede:`,
              items: [
                'Dejar una reseña honesta en la plataforma para informar a otros usuarios.',
                'Contactar directamente al proveedor para resolver el inconveniente.',
                'Contactar a NegociClick si considera que el proveedor incumplió lo ofrecido en la plataforma; evaluaremos cada caso individualmente.',
              ],
            },
            {
              title: '6. Plazos de respuesta',
              content: `NegociClick se compromete a responder todas las solicitudes de reembolso o cancelación en un plazo máximo de 3 días hábiles desde la recepción de la solicitud. Los reembolsos aprobados se procesan entre 5 y 10 días hábiles adicionales según la entidad bancaria.`,
            },
            {
              title: '7. Contacto para devoluciones',
              content: `Para cualquier consulta sobre devoluciones o cancelaciones, contáctanos en:`,
              items: [
                'Email: negociclick2026@gmail.com',
                'Asunto del correo: "Solicitud de reembolso — [número de reserva]"',
                'También puedes presentar un reclamo formal a través de nuestro Libro de Reclamaciones.',
              ],
            },
          ].map(({ title, content, items }) => (
            <section key={title}>
              <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{content}</p>
              {items && (
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-indigo-400 font-bold mt-0.5 flex-shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="border-t border-gray-100 pt-6 flex flex-wrap gap-4 text-sm text-gray-400">
            <Link href="/terminos" className="hover:text-indigo-600 transition">Términos y condiciones</Link>
            <Link href="/reclamos" className="hover:text-indigo-600 transition">Libro de Reclamaciones</Link>
            <Link href="/contacto" className="hover:text-indigo-600 transition">Contacto</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
