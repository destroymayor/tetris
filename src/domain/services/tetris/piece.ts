import { getKicks } from '@/domain/constants/kicks';
import { SPAWN_X, SPAWN_Y } from '@/domain/constants/tetrominoes';
import type { Board, Piece, PieceType, Rotation } from './types';
import { isCollision } from './board';

export function spawnPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: SPAWN_X[type], y: SPAWN_Y };
}

export function move(piece: Piece, dx: number, dy: number): Piece {
  return { ...piece, x: piece.x + dx, y: piece.y + dy };
}

export function tryMove(
  board: Board,
  piece: Piece,
  dx: number,
  dy: number,
): Piece | null {
  const next = move(piece, dx, dy);
  return isCollision(board, next) ? null : next;
}

export interface RotateResult {
  piece: Piece;
  kickIndex: number;
}

export function tryRotate(
  board: Board,
  piece: Piece,
  direction: 1 | -1,
): RotateResult | null {
  const from = piece.rotation;
  const to = (((piece.rotation + direction) % 4) + 4) % 4 as Rotation;
  const kicks = getKicks(piece.type, from, to);
  for (let i = 0; i < kicks.length; i++) {
    const [kdx, kdy] = kicks[i];
    const candidate: Piece = {
      ...piece,
      rotation: to,
      x: piece.x + kdx,
      y: piece.y + kdy,
    };
    if (!isCollision(board, candidate)) return { piece: candidate, kickIndex: i };
  }
  return null;
}

export function hardDropDistance(board: Board, piece: Piece): number {
  let dy = 0;
  while (!isCollision(board, move(piece, 0, dy + 1))) {
    dy++;
  }
  return dy;
}

export function ghostPosition(board: Board, piece: Piece): number {
  return piece.y + hardDropDistance(board, piece);
}
