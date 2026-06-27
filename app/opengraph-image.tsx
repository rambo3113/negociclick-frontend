import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'NegociClick — Reserva servicios en Lima';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #2e1065 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Blob superior izquierdo */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-120px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          display: 'flex',
        }} />

        {/* Blob inferior derecho */}
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-80px',
          width: '420px', height: '420px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
          borderRadius: '50%',
          display: 'flex',
        }} />

        {/* Contenido principal */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          width: '100%',
          height: '100%',
        }}>

          {/* Logo arriba */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}>
              S
            </div>
            <span style={{
              fontSize: '34px', fontWeight: '900',
              color: 'white', letterSpacing: '-0.5px',
            }}>
              NegociClick
            </span>
          </div>

          {/* Texto central */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Badge */}
            <div style={{ display: 'flex' }}>
              <div style={{
                background: 'rgba(99,102,241,0.25)',
                border: '1px solid rgba(99,102,241,0.5)',
                borderRadius: '100px',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: '#a5b4fc', fontSize: '16px', fontWeight: '600' }}>
                  Marketplace de servicios N.1 en Lima, Peru
                </span>
              </div>
            </div>

            {/* Headline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{
                fontSize: '70px',
                fontWeight: '900',
                color: 'white',
                lineHeight: '1.05',
                letterSpacing: '-2px',
              }}>
                Reserva cualquier
              </span>
              <span style={{
                fontSize: '70px',
                fontWeight: '900',
                lineHeight: '1.05',
                letterSpacing: '-2px',
                color: '#a78bfa',
              }}>
                servicio en segundos
              </span>
            </div>

            <span style={{
              fontSize: '22px',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: '400',
            }}>
              Barberos, spas, dentistas, masajes y 27 categorias mas.
            </span>
          </div>

          {/* Stats abajo */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { value: '27+',  label: 'Categorias' },
              { value: '4.8',  label: 'Rating promedio' },
              { value: 'S/ 0', label: 'Para empezar' },
              { value: '0%',   label: 'Comision' },
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '16px 32px',
                gap: '6px',
              }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
