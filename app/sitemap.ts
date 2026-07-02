import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.negociclick.com';

const CATEGORY_SLUGS = [
  'barberia-lima', 'spa-lima', 'salon-belleza-lima', 'dentista-lima',
  'veterinaria-lima', 'gimnasio-lima', 'psicologo-lima', 'nutricionista-lima',
  'tatuajes-lima', 'fisioterapia-lima', 'micropigmentacion-lima', 'maquillaje-lima',
  'depilacion-lima', 'masajes-domicilio-lima', 'nail-art-lima', 'peluqueria-canina-lima',
  'electricista-lima', 'gasfitero-lima', 'jardineria-lima', 'limpieza-hogar-lima',
  'reposteria-lima', 'catering-lima', 'clases-particulares-lima',
  'entrenador-personal-lima', 'fotografia-lima', 'mudanzas-lima',
  'fumigacion-lima', 'clases-musica-lima', 'clases-baile-lima', 'animacion-infantil-lima',
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/register`,        lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${BASE}/login`,           lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${BASE}/subscription`,    lastModified: new Date(), changeFrequency: 'weekly',   priority: 0.8 },
    { url: `${BASE}/sobre-nosotros`,  lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.6 },
    { url: `${BASE}/contacto`,        lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.6 },
    { url: `${BASE}/soporte`,         lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${BASE}/terminos`,        lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE}/privacidad`,      lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE}/devoluciones`,    lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE}/reclamos`,        lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
  ];

  // Landing pages por categoría
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map(slug => ({
    url: `${BASE}/servicios/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  try {
    // Fetch all active businesses for dynamic routes
    let page = 1;
    const businessUrls: MetadataRoute.Sitemap = [];

    while (true) {
      const res = await fetch(`${API}/businesses?limit=50&page=${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      const businesses: Array<{ id: string; updatedAt?: string }> = data.businesses ?? [];
      if (businesses.length === 0) break;

      for (const biz of businesses) {
        businessUrls.push({
          url: `${BASE}/businesses/${biz.id}`,
          lastModified: biz.updatedAt ? new Date(biz.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }

      if (page >= (data.pages ?? 1)) break;
      page++;
    }

    return [...staticRoutes, ...categoryRoutes, ...businessUrls];
  } catch {
    return [...staticRoutes, ...categoryRoutes];
  }
}
