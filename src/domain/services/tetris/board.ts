import { COLS, ROWS } from '@/domain/constants/board';
import { getShape } from '@/domain/constants/tetrominoes';
import type { Board, Piece } from './types';

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  );
}

export function isCollision(board: Board, piece: Piece): boolean {
  const shape = getShape(piece.type, piece.rotation);
  for (let dy = 0; dy < shape.length; dy++) {
    const row = shape[dy];
    for (let dx = 0; dx < row.length; dx++) {
      if (!row[dx]) continue;
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y < 0) continue;
      if (board[y][x] !== null) return true;
    }
  }
  return false;
}

export function lockPiece(board: Board, piece: Piece): Board {
  const shape = getShape(piece.type, piece.rotation);
  const next = board.map((row) => row.slice());
  for (let dy = 0; dy < shape.length; dy++) {
    const row = shape[dy];
    for (let dx = 0; dx < row.length; dx++) {
      if (!row[dx]) continue;
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
      next[y][x] = piece.type;
    }
  }
  return next;
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - remaining.length;
  if (cleared === 0) return { board, cleared: 0 };
  const empty: Board = Array.from({ length: cleared }, () =>
    Array.from({ length: COLS }, () => null),
  );
  return { board: [...empty, ...remaining], cleared };
}
