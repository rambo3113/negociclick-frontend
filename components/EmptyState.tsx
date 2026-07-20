import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  /** Link CTA — navigates to another page */
  cta?: { label: string; href: string };
  /** Button CTA — client-side callback (e.g. clear filters) */
  ctaButton?: { label: string; onClick: () => void };
  /** Extra content below the CTA (e.g. quick-filter chips) */
  children?: ReactNode;
}

const CTA_CLASS =
  'inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

export default function EmptyState({
  emoji,
  title,
  description,
  cta,
  ctaButton,
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 px-4" role="status" aria-live="polite">
      <div
        className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">{description}</p>

      {cta && (
        <Link href={cta.href} className={CTA_CLASS}>
          {cta.label}
        </Link>
      )}

      {ctaButton && (
        <button type="button" onClick={ctaButton.onClick} className={CTA_CLASS}>
          {ctaButton.label}
        </button>
      )}

      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
