import { memo, useMemo } from 'react';
import type { PieceType } from '@/domain';
import { getShape } from '@/domain';
import { cn } from '@/lib/utils';

interface PiecePreviewProps {
  type: PieceType | null;
  dim?: boolean;
}

const PREVIEW_SIZE = 4;

const PREVIEW_STYLE: React.CSSProperties = {
  gridTemplateColumns: `repeat(${PREVIEW_SIZE}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${PREVIEW_SIZE}, minmax(0, 1fr))`,
  gap: 'var(--cell-gap)',
  aspectRatio: '1 / 1',
};

export const PiecePreview = memo(function PiecePreview({
  type,
  dim,
}: PiecePreviewProps) {
  const cells = useMemo(() => {
    return Array.from({ length: PREVIEW_SIZE * PREVIEW_SIZE }, (_, idx) => {
      const y = Math.floor(idx / PREVIEW_SIZE);
      const x = idx % PREVIEW_SIZE;
      return isFilled(type, y, x) && type ? type : null;
    });
  }, [type]);

  return (
    <div
      className={cn('grid', dim && 'opacity-40 saturate-50')}
      style={PREVIEW_STYLE}
    >
      {cells.map((piece, idx) => (
        <div
          key={idx}
          className="cell"
          data-piece={piece ?? undefined}
        />
      ))}
    </div>
  );
});

function isFilled(type: PieceType | null, y: number, x: number): boolean {
  if (!type) return false;
  const shape = getShape(type, 0);
  const rows = shape.length;
  const cols = shape[0].length;
  // Center the piece in a 4x4 grid
  const offsetY = Math.floor((PREVIEW_SIZE - rows) / 2);
  const offsetX = Math.floor((PREVIEW_SIZE - cols) / 2);
  const gy = y - offsetY;
  const gx = x - offsetX;
  if (gy < 0 || gy >= rows || gx < 0 || gx >= cols) return false;
  return shape[gy][gx] === 1;
}
