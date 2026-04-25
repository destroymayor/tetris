import { PIECE_TYPES } from '@/domain/constants/tetrominoes';
import type { PieceType } from './types';

export function createBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function refillIfNeeded(bag: PieceType[], minSize: number): PieceType[] {
  if (bag.length >= minSize) return bag;
  return [...bag, ...createBag()];
}

export function takeNext(
  bag: PieceType[],
): { piece: PieceType; bag: PieceType[] } {
  const refilled = refillIfNeeded(bag, 1);
  const [piece, ...rest] = refilled;
  return { piece, bag: rest };
}
