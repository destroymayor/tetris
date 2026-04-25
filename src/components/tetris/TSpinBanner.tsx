import { memo, type CSSProperties } from 'react';
import type { TSpinKind } from '@/domain';

interface Props {
  pulse: number;
  kind: TSpinKind;
  lines: number;
}

const TSPIN_LINE_LABEL = ['', 'SINGLE', 'DOUBLE', 'TRIPLE'] as const;
const MINI_LINE_LABEL = ['', 'SINGLE', 'DOUBLE'] as const;

function getLabel(kind: TSpinKind, lines: number): string | null {
  if (kind === 'tspin') {
    if (lines === 0) return 'T-SPIN!';
    return `T-SPIN ${TSPIN_LINE_LABEL[Math.min(lines, 3)]}!`;
  }
  if (kind === 'mini') {
    if (lines === 0) return 'T-SPIN MINI!';
    return `T-SPIN MINI ${MINI_LINE_LABEL[Math.min(lines, 2)]}!`;
  }
  return null;
}

function intensityOf(kind: TSpinKind, lines: number): 'low' | 'mid' | 'high' {
  if (kind === 'mini') return 'low';
  if (kind === 'tspin' && lines >= 2) return 'high';
  return 'mid';
}

export const TSpinBanner = memo(function TSpinBanner({
  pulse,
  kind,
  lines,
}: Props) {
  const active = pulse > 0 && kind !== 'none';
  const label = active ? getLabel(kind, lines) : null;
  const intensity = active ? intensityOf(kind, lines) : 'mid';

  return (
    <div className="tspin-slot" aria-live="polite">
      {label && (
        <div
          key={pulse}
          className="tspin-banner"
          data-kind={kind}
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
