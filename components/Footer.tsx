import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Marca */}
          <div>
            <div className="mb-4">
              <Logo size="md" light />
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              Marketplace de reservas de servicios en Lima, Perú. Conectamos clientes con los mejores profesionales.
            </p>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terminos" className="hover:text-white transition">Términos y condiciones</Link></li>
              <li><Link href="/devoluciones" className="hover:text-white transition">Política de devoluciones</Link></li>
              <li><Link href="/reclamos" className="hover:text-white transition">Libro de reclamaciones</Link></li>
              <li><Link href="/contacto" className="hover:text-white transition">Contacto</Link></li>
            </ul>
          </div>

          {/* Para negocios */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Para negocios</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register?role=VENDOR" className="hover:text-white transition">Publica tu negocio gratis</Link></li>
              <li><Link href="/subscription" className="hover:text-white transition">Planes y precios</Link></li>
              <li><Link href="/login?role=VENDOR" className="hover:text-white transition">Ingresar al panel</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <a href="mailto:noreply@negociclick.com" className="hover:text-white transition break-all">
                  noreply@negociclick.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <a href="https://wa.me/51983081196" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  +51 983 081 196
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Lima, Perú</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {year} NegociClick. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="hover:text-slate-400 transition">Términos</Link>
            <Link href="/devoluciones" className="hover:text-slate-400 transition">Devoluciones</Link>
            <Link href="/reclamos" className="hover:text-slate-400 transition">Reclamaciones</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
