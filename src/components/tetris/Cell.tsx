import { memo } from 'react';
import type { PieceType } from '@/domain';

interface CellProps {
  type: PieceType | null;
  ghost?: PieceType | null;
}

export const Cell = memo(function Cell({ type, ghost }: CellProps) {
  return (
    <div
      className="cell"
      data-piece={type ?? undefined}
      data-ghost={!type && ghost ? ghost : undefined}
    />
  );
});
