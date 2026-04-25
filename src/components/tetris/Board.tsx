import { memo } from 'react';
import type { PieceType } from '@/domain';
import { COLS, ROWS } from '@/domain';
import { cn } from '@/lib/utils';
import { Cell } from './Cell';

export interface RenderedCell {
  type: PieceType | null;
  ghost: PieceType | null;
}

interface BoardProps {
  cells: RenderedCell[][];
  className?: string;
}

const BOARD_STYLE: React.CSSProperties = {
  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
  aspectRatio: `${COLS} / ${ROWS}`,
};

export const Board = memo(function Board({ cells, className }: BoardProps) {
  return (
    <div className={cn('board', className)} style={BOARD_STYLE}>
      {cells.flatMap((row, y) =>
        row.map((cell, x) => (
          <Cell key={`${y}-${x}`} type={cell.type} ghost={cell.ghost} />
        )),
      )}
    </div>
  );
});
