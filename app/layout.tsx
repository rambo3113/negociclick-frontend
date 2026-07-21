import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import ChatWidget from "@/components/ChatWidget";
import CookieBanner from "@/components/CookieBanner";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";

const geist = Geist({ subsets: ["latin"], display: "swap" });

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';
const GA_ID  = process.env.NEXT_PUBLIC_GA_ID  ?? '';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.negociclick.com'),
  title: { default: "NegociClick — Reserva servicios en Lima", template: "%s | NegociClick" },
  description: "Reserva los mejores barberos, dentistas, masajistas, spas y más en Lima, Perú. Más de 36 categorías de servicios. Agenda en segundos, paga seguro.",
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
    description: "Encuentra y reserva los mejores servicios cerca de ti en Lima, Perú. Más de 36 categorías.",
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
      <body className={`${geist.className} min-h-full flex flex-col bg-gray-50`}>
        <NextAuthSessionProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ChatWidget />
              <CookieBanner />
            </ToastProvider>
          </AuthProvider>
        </NextAuthSessionProvider>

        {/* ── Google Tag Manager ── lazyOnload: se carga tras load+idle, sin bloquear render */}
        {GTM_ID && (
          <>
            <Script
              id="gtm-script"
              src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
              strategy="lazyOnload"
            />
            <Script id="gtm-init" strategy="lazyOnload">{`
              window.dataLayer=window.dataLayer||[];
              window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            `}</Script>
          </>
        )}

        {/* ── Google Analytics (GA4) — solo si no hay GTM configurado ── */}
        {GA_ID && !GTM_ID && (
          <>
            <Script
              id="ga-script"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga-init" strategy="lazyOnload">{`
              window.dataLayer=window.dataLayer||[];
              function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());
              gtag('config','${GA_ID}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
