import type { StateCreator } from 'zustand';
import type {
  Board,
  GameStateDto,
  GameStatus,
  Piece,
  PieceType,
} from '@/domain';
import {
  HARD_DROP_POINT,
  SOFT_DROP_POINT,
  advanceTickUsecase,
  createEmptyBoard,
  forceLockUsecase,
  ghostPosition,
  hardDropUsecase,
  isCollision,
  noteAction,
  spawnNext,
  spawnPiece,
  tryMove,
  tryRotate,
} from '@/domain';

const HIGH_SCORE_KEY = 'tetris.highScore';

function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function persistHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    /* ignore */
  }
}

function freshState(highScore: number): GameStateDto {
  return {
    board: createEmptyBoard(),
    active: null,
    ghostY: 0,
    hold: null,
    canHold: true,
    queue: [],
    bag: [],
    score: 0,
    level: 1,
    lines: 0,
    status: 'idle',
    highScore,
    lastAction: 'spawn',
    lastKickIndex: -1,
    lockDelay: { groundedAt: null, resets: 0, pausedElapsedMs: 0 },
    lastTSpin: 'none',
    lastTSpinLines: 0,
    tspinCounter: 0,
  };
}

export interface GameSlice extends GameStateDto {
  start: () => void;
  reset: () => void;
  togglePause: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  rotateCW: () => void;
  rotateCCW: () => void;
  swapHold: () => void;
  tick: () => void;
  forceLock: () => void;
}

type GameStateView = GameStateDto;

function withGhost(state: GameStateView): GameStateView {
  if (!state.active) return state;
  return { ...state, ghostY: ghostPosition(state.board, state.active) };
}

function persist(state: GameStateView): GameStateView {
  if (state.score > state.highScore) persistHighScore(state.score);
  else if (state.status === 'gameover') persistHighScore(state.highScore);
  return state;
}

export const createGameSlice: StateCreator<GameSlice> = (set, get) => ({
  ...freshState(loadHighScore()),

  start: () => {
    const fresh = freshState(get().highScore);
    set({ ...spawnNext({ ...fresh, status: 'running' }) });
  },

  reset: () => {
    set({ ...freshState(loadHighScore()) });
  },

  togglePause: () => {
    const s = get();
    if (s.status === 'running') {
      // Snapshot lock-delay elapsed so the timer doesn't immediately fire on resume.
      const ld = s.lockDelay;
      const elapsed =
        ld.groundedAt !== null ? Math.max(0, Date.now() - ld.groundedAt) : 0;
      set({
        ...s,
        status: 'paused',
        lockDelay: {
          groundedAt: null,
          resets: ld.resets,
          pausedElapsedMs: elapsed,
        },
      });
    } else if (s.status === 'paused') {
      const ld = s.lockDelay;
      const restoredGroundedAt =
        ld.pausedElapsedMs > 0 ? Date.now() - ld.pausedElapsedMs : null;
      set({
        ...s,
        status: 'running',
        lockDelay: {
          groundedAt: restoredGroundedAt,
          resets: ld.resets,
          pausedElapsedMs: 0,
        },
      });
    }
  },

  moveLeft: () => {
    const s = get();
    if (s.status !== 'running' || !s.active) return;
    const next = tryMove(s.board, s.active, -1, 0);
    if (!next) return;
    set(withGhost(noteAction({ ...s, active: next }, 'move', -1, Date.now())));
  },

  moveRight: () => {
    const s = get();
    if (s.status !== 'running' || !s.active) return;
    const next = tryMove(s.board, s.active, 1, 0);
    if (!next) return;
    set(withGhost(noteAction({ ...s, active: next }, 'move', -1, Date.now())));
  },

  softDrop: () => {
    const s = get();
    if (s.status !== 'running' || !s.active) return;
    const next = tryMove(s.board, s.active, 0, 1);
    if (next) {
      set(
        withGhost(
          noteAction(
            { ...s, active: next, score: s.score + SOFT_DROP_POINT },
            'softDrop',
            -1,
            Date.now(),
          ),
        ),
      );
      return;
    }
    // Grounded soft-drop: enter lock-delay, do not lock immediately.
    if (s.lockDelay.groundedAt === null) {
      set({
        ...s,
        lastAction: 'softDrop',
        lastKickIndex: -1,
        lockDelay: {
          groundedAt: Date.now(),
          resets: 0,
          pausedElapsedMs: 0,
        },
      });
    }
  },

  hardDrop: () => {
    const s = get();
    if (s.status !== 'running' || !s.active) return;
    const { state, cellsDropped } = hardDropUsecase(s);
    const scored: GameStateView = {
      ...state,
      score: state.score + cellsDropped * HARD_DROP_POINT,
    };
    set(persist({ ...scored, highScore: Math.max(scored.highScore, scored.score) }));
  },

  rotateCW: () => {
    const s = get();
    if (s.status !== 'running' || !s.active) return;
    const r = tryRotate(s.board, s.active, 1);
    if (!r) return;
    set(
      withGhost(
        noteAction({ ...s, active: r.piece }, 'rotate', r.kickIndex, Date.now()),
      ),
    );
  },

  rotateCCW: () => {
    const s = get();
    if (s.status !== 'running' || !s.active) return;
    const r = tryRotate(s.board, s.active, -1);
    if (!r) return;
    set(
      withGhost(
        noteAction({ ...s, active: r.piece }, 'rotate', r.kickIndex, Date.now()),
      ),
    );
  },

  swapHold: () => {
    const s = get();
    if (s.status !== 'running' || !s.active || !s.canHold) return;
    const heldType: PieceType = s.active.type;

    if (s.hold === null) {
      const promoted = spawnNext({
        ...s,
        active: null,
        hold: heldType,
        canHold: false,
      });
      set(withGhost({ ...promoted, canHold: false }));
      return;
    }

    const swappedPiece: Piece = spawnPiece(s.hold);
    const board: Board = s.board;
    if (isCollision(board, swappedPiece)) {
      set({ ...s, status: 'gameover' satisfies GameStatus });
      persistHighScore(Math.max(s.highScore, s.score));
      return;
    }
    set(
      withGhost({
        ...s,
        active: swappedPiece,
        hold: heldType,
        canHold: false,
        lastAction: 'hold',
        lastKickIndex: -1,
        lockDelay: { groundedAt: null, resets: 0, pausedElapsedMs: 0 },
      }),
    );
  },

  tick: () => {
    const s = get();
    if (s.status !== 'running') return;
    set(persist(advanceTickUsecase(s, Date.now())));
  },

  forceLock: () => {
    const s = get();
    if (s.status !== 'running') return;
    set(persist(forceLockUsecase(s)));
  },
});
