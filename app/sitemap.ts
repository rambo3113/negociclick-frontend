import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://negociclick.pe';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                  lastModified: new Date(), priority: 1.0,  changeFrequency: 'daily'   },
    { url: `${base}/login`,       lastModified: new Date(), priority: 0.3,  changeFrequency: 'yearly'  },
    { url: `${base}/register`,    lastModified: new Date(), priority: 0.4,  changeFrequency: 'yearly'  },
    { url: `${base}/terminos`,    lastModified: new Date(), priority: 0.2,  changeFrequency: 'yearly'  },
    { url: `${base}/privacidad`,  lastModified: new Date(), priority: 0.2,  changeFrequency: 'yearly'  },
  ];

  try {
    const res = await fetch(`${apiUrl}/businesses?limit=500`, { next: { revalidate: 3600 } });
    if (!res.ok) return staticRoutes;

    const data = await res.json() as { businesses?: { id: string; updatedAt?: string }[] };
    const businesses = data.businesses ?? [];

    const businessRoutes: MetadataRoute.Sitemap = businesses.map(b => ({
      url: `${base}/businesses/${b.id}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }));

    return [...staticRoutes, ...businessRoutes];
  } catch {
    return staticRoutes;
  }
}
