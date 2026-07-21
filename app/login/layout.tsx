import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  alternates: { canonical: '/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
