import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import ChatWidget from "@/components/ChatWidget";

const GA_ID = 'G-F2Q5BPY76D';

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://negociclick.pe'),
  title: { default: "NegociClick — Reserva servicios en Lima", template: "%s | NegociClick" },
  description: "Reserva los mejores barberos, dentistas, masajistas, spas y más en Lima, Perú. Más de 27 categorías de servicios. Agenda en segundos, paga seguro.",
  keywords: ["reservas Lima", "servicios Lima", "barbería Lima", "spa Lima", "dentista Lima", "NegociClick", "reservar cita Lima"],
  authors: [{ name: "NegociClick" }],
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "NegociClick",
    title: "NegociClick — Reserva servicios en Lima",
    description: "Encuentra y reserva los mejores servicios cerca de ti en Lima, Perú. Más de 27 categorías.",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://negociclick.pe',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'NegociClick — Marketplace de servicios en Lima' }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NegociClick — Reserva servicios en Lima",
    description: "Encuentra y reserva los mejores servicios cerca de ti en Lima, Perú.",
    images: ['/opengraph-image'],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </head>
      <body className={`${geist.className} min-h-full flex flex-col bg-gray-50`}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <ChatWidget />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
