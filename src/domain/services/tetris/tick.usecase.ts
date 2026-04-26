import { MAX_LOCK_RESETS } from '@/domain/constants/lockDelay';
import type { GameStateDto, LastAction } from './types';
import { clearLines, isCollision, lockPiece } from './board';
import {
  ghostPosition,
  hardDropDistance,
  spawnPiece,
  tryMove,
} from './piece';
import { refillIfNeeded, takeNext } from './bag';
import { computeLineScore, levelFromLines } from './scoring';
import { computeComboBonus, nextCombo } from './combo';
import { detectTSpin } from './tspin';

const QUEUE_SIZE = 3;

export interface SpawnNextResult {
  state: GameStateDto;
}

export function spawnNext(state: GameStateDto): GameStateDto {
  let queue = [...state.queue];
  let bag = state.bag;

  while (queue.length < QUEUE_SIZE + 1) {
    bag = refillIfNeeded(bag, 1);
    const { piece, bag: nextBag } = takeNext(bag);
    queue.push(piece);
    bag = nextBag;
  }

  const [next, ...rest] = queue;
  queue = rest;

  bag = refillIfNeeded(bag, QUEUE_SIZE);
  while (queue.length < QUEUE_SIZE) {
    const { piece, bag: nextBag } = takeNext(bag);
    queue.push(piece);
    bag = nextBag;
  }

  const piece = spawnPiece(next);

  if (isCollision(state.board, piece)) {
    return {
      ...state,
      active: null,
      queue,
      bag,
      status: 'gameover',
      ghostY: 0,
      canHold: true,
      highScore: Math.max(state.highScore, state.score),
      lastAction: 'spawn',
      lastKickIndex: -1,
      lockDelay: { groundedAt: null, resets: 0, pausedElapsedMs: 0 },
    };
  }

  return {
    ...state,
    active: piece,
    queue,
    bag,
    canHold: true,
    ghostY: ghostPosition(state.board, piece),
    lastAction: 'spawn',
    lastKickIndex: -1,
    lockDelay: { groundedAt: null, resets: 0, pausedElapsedMs: 0 },
  };
}

export function lockAndAdvance(state: GameStateDto): GameStateDto {
  if (!state.active) return state;
  const tspin = detectTSpin(
    state.board,
    state.active,
    state.lastAction,
    state.lastKickIndex,
  );
  const locked = lockPiece(state.board, state.active);
  const { board: cleared, cleared: count } = clearLines(locked);
  const newLines = state.lines + count;
  const newLevel = levelFromLines(newLines);
  const addScore = computeLineScore({ linesCleared: count, level: state.level, tspin });
  const newCombo = nextCombo(state.combo, count);
  const comboBonus = computeComboBonus(newCombo, state.level);
  const newScore = state.score + addScore + comboBonus;

  const baseState: GameStateDto = {
    ...state,
    board: cleared,
    active: null,
    lines: newLines,
    level: newLevel,
    score: newScore,
    highScore: Math.max(state.highScore, newScore),
    lastTSpin: tspin,
    lastTSpinLines: count,
    tspinCounter: tspin === 'none' ? state.tspinCounter : state.tspinCounter + 1,
    combo: newCombo,
    comboPulse: comboBonus > 0 ? state.comboPulse + 1 : state.comboPulse,
  };

  return spawnNext(baseState);
}

function isGrounded(state: GameStateDto): boolean {
  if (!state.active) return false;
  return isCollision(state.board, { ...state.active, y: state.active.y + 1 });
}

export function noteAction(
  state: GameStateDto,
  action: LastAction,
  kickIndex: number,
  now: number,
): GameStateDto {
  const tagged: GameStateDto = {
    ...state,
    lastAction: action,
    lastKickIndex: kickIndex,
  };

  if (!isGrounded(tagged)) {
    return { ...tagged, lockDelay: { groundedAt: null, resets: 0, pausedElapsedMs: 0 } };
  }

  const ld = state.lockDelay;
  if (ld.groundedAt === null) {
    return { ...tagged, lockDelay: { groundedAt: now, resets: 0, pausedElapsedMs: 0 } };
  }
  if (ld.resets >= MAX_LOCK_RESETS) {
    return tagged;
  }
  return {
    ...tagged,
    lockDelay: { groundedAt: now, resets: ld.resets + 1, pausedElapsedMs: 0 },
  };
}

export function advanceTickUsecase(
  state: GameStateDto,
  now: number,
): GameStateDto {
  if (state.status !== 'running' || !state.active) return state;
  const moved = tryMove(state.board, state.active, 0, 1);
  if (moved) {
    return {
      ...state,
      active: moved,
      ghostY: ghostPosition(state.board, moved),
      lockDelay: { groundedAt: null, resets: 0, pausedElapsedMs: 0 },
    };
  }
  if (state.lockDelay.groundedAt === null) {
    return {
      ...state,
      lockDelay: { groundedAt: now, resets: 0, pausedElapsedMs: 0 },
    };
  }
  return state;
}

export function forceLockUsecase(state: GameStateDto): GameStateDto {
  if (state.status !== 'running' || !state.active) return state;
  if (state.lockDelay.groundedAt === null) return state;
  if (!isGrounded(state)) return state;
  return lockAndAdvance(state);
}

export function hardDropUsecase(
  state: GameStateDto,
): { state: GameStateDto; cellsDropped: number } {
  if (state.status !== 'running' || !state.active) {
    return { state, cellsDropped: 0 };
  }
  const distance = hardDropDistance(state.board, state.active);
  const dropped = { ...state.active, y: state.active.y + distance };
  const tagged: GameStateDto = {
    ...state,
    active: dropped,
    lastAction: 'hardDrop',
    lastKickIndex: -1,
  };
  return {
    state: lockAndAdvance(tagged),
    cellsDropped: distance,
  };
}
