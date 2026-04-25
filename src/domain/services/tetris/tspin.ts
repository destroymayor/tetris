import { COLS, ROWS } from '@/domain/constants/board';
import type { Board, LastAction, Piece, Rotation, TSpinKind } from './types';

function isFilled(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
  return board[y][x] !== null;
}

const FRONT_CORNERS: Record<Rotation, readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1]> = {
  // [TL, TR, BL, BR] booleans flagging which two are "front"
  0: [1, 1, 0, 0],
  1: [0, 1, 0, 1],
  2: [0, 0, 1, 1],
  3: [1, 0, 1, 0],
};

export function detectTSpin(
  board: Board,
  piece: Piece,
  lastAction: LastAction,
  lastKickIndex: number,
): TSpinKind {
  if (piece.type !== 'T' || lastAction !== 'rotate') return 'none';

  const tl = isFilled(board, piece.x, piece.y);
  const tr = isFilled(board, piece.x + 2, piece.y);
  const bl = isFilled(board, piece.x, piece.y + 2);
  const br = isFilled(board, piece.x + 2, piece.y + 2);

  const total = (tl ? 1 : 0) + (tr ? 1 : 0) + (bl ? 1 : 0) + (br ? 1 : 0);
  if (total < 3) return 'none';

  const flags = FRONT_CORNERS[piece.rotation];
  const corners = [tl, tr, bl, br];
  const frontFilled = corners.reduce(
    (acc, filled, i) => acc + (flags[i] && filled ? 1 : 0),
    0,
  );

  // SRS: the 5th kick (index 4) — the long diagonal kick — upgrades a Mini
  // to a full T-Spin per Tetris Guideline.
  if (lastKickIndex === 4) return 'tspin';
  if (frontFilled === 2) return 'tspin';
  return 'mini';
}
