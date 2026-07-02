import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.negociclick.com';

const CATEGORY_LABEL: Record<string, string> = {
  BARBERIA: 'Barbería', SPA: 'Spa', SALON_BELLEZA: 'Salón de Belleza',
  ODONTOLOGIA: 'Odontología', VETERINARIA: 'Veterinaria', GIMNASIO: 'Gimnasio',
  TATUAJES: 'Tatuajes', PSICOLOGO: 'Psicólogo', NUTRICIONISTA: 'Nutricionista',
  FISIOTERAPIA: 'Fisioterapia', MICROPIGMENTACION: 'Micropigmentación',
  MAQUILLAJE: 'Maquillaje', DEPILACION: 'Depilación', MASAJES_DOMICILIO: 'Masajes',
  NAIL_ART: 'Nail Art', PELUQUERIA_CANINA: 'Peluquería Canina',
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/businesses/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};

    const { business } = await res.json();
    if (!business) return {};

    const catLabel = CATEGORY_LABEL[business.category] ?? business.category ?? 'Servicios';
    const city = business.city ?? 'Lima';
    const title = `${business.name} — ${catLabel} en ${city} | NegociClick`;
    const description = business.description
      ?? `Reserva servicios de ${business.name} en ${city}, Perú. ${catLabel} con reservas online 24/7 — NegociClick.`;
    const url = `${SITE}/businesses/${id}`;
    const images = business.coverImage ? [{ url: business.coverImage, width: 1200, height: 630, alt: business.name }] : [];

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        locale: 'es_PE',
        siteName: 'NegociClick',
        ...(images.length ? { images } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
