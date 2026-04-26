import { memo, type CSSProperties } from 'react';

interface Props {
  pulse: number;
  combo: number;
}

function intensityOf(combo: number): 'low' | 'mid' | 'high' {
  if (combo >= 4) return 'high';
  if (combo >= 2) return 'mid';
  return 'low';
}

export const ComboBanner = memo(function ComboBanner({ pulse, combo }: Props) {
  const active = pulse > 0 && combo >= 1;
  const label = active ? `COMBO x${combo}!` : null;
  const intensity = active ? intensityOf(combo) : 'low';

  return (
    <div className="tspin-slot" aria-live="polite">
      {label && (
        <div
          key={pulse}
          className="tspin-banner"
          data-kind="combo"
          data-intensity={intensity}
        >
          <div className="tspin-banner__glow" aria-hidden="true" />
          <span className="tspin-banner__label">
            {Array.from(label).map((char, i) => (
              <span
                key={i}
                className="tspin-banner__char"
                style={{ '--i': i } as CSSProperties}
              >
                {char === ' ' ? ' ' : char}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
});
