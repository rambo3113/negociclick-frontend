interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  light?: boolean;
}

export default function Logo({ size = 'md', variant = 'full', light = false }: LogoProps) {
  const iconSizes = { sm: 28, md: 36, lg: 52 };
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  const s = iconSizes[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Ícono */}
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="url(#grad)" />
        {/* Rayo / cursor */}
        <path
          d="M22 7L13 22H20L18 33L27 18H20L22 7Z"
          fill="white"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Texto */}
      {variant === 'full' && (
        <span className={`font-extrabold tracking-tight ${textSizes[size]}`}>
          <span className={light ? 'text-white' : 'text-gray-900'}>Negoci</span>
          <span className={light ? 'text-indigo-400' : 'text-indigo-600'}>Click</span>
        </span>
      )}
    </div>
  );
}
