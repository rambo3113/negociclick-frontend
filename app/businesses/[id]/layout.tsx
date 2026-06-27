import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/businesses/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};

    const data = await res.json();
    const business = data.business;

    const title       = business.name ?? 'Negocio';
    const description = business.description
      ?? `Reserva servicios de ${business.name} en ${business.city ?? 'Lima'}, Perú — NegociClick`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'es_PE',
        siteName: 'NegociClick',
        ...(business.coverImage ? { images: [{ url: business.coverImage }] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
