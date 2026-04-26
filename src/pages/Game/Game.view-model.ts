import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/store';
import {
  COLS,
  LOCK_DELAY_MS,
  ROWS,
  getShape,
  gravityIntervalMs,
} from '@/domain';
import type { GameStatus, PieceType, TSpinKind } from '@/domain';
import type { RenderedCell } from '@/components/tetris/Board';

interface TSpinPayload {
  kind: TSpinKind;
  lines: number;
}

// Auto-repeat tuning for left/right/soft-drop. We bypass the OS keyboard repeat
// (which is ~500 ms initial / ~30 ms after) and run our own DAS/ARR like modern
// guideline Tetris clients (Tetr.io, Jstris). Defaults below match Jstris-style
// competitive tuning — snappy but still controllable for taps.
const DAS_MS = 133; // delay before auto-shift kicks in
const ARR_MS = 33; // interval between auto-shifts after DAS
const SOFT_DROP_MS = 30; // soft-drop repeat interval (no DAS)

interface RepeatTimers {
  dasTimer: number | null;
  arrTimer: number | null;
}

interface ViewModel {
  cells: RenderedCell[][];
  hold: PieceType | null;
  canHold: boolean;
  queue: PieceType[];
  score: number;
  level: number;
  lines: number;
  highScore: number;
  status: GameStatus;
  clearPulse: number;
  clearAmount: number;
  tspinPulse: number;
  tspinPayload: TSpinPayload;
  combo: number;
  comboPulse: number;
  onStart: () => void;
  onResume: () => void;
}

export function useGameViewModel(): ViewModel {
  const board = useAppStore((s) => s.board);
  const active = useAppStore((s) => s.active);
  const ghostY = useAppStore((s) => s.ghostY);
  const hold = useAppStore((s) => s.hold);
  const canHold = useAppStore((s) => s.canHold);
  const queue = useAppStore((s) => s.queue);
  const score = useAppStore((s) => s.score);
  const level = useAppStore((s) => s.level);
  const lines = useAppStore((s) => s.lines);
  const status = useAppStore((s) => s.status);
  const highScore = useAppStore((s) => s.highScore);
  const groundedAt = useAppStore((s) => s.lockDelay.groundedAt);
  const tspinCounter = useAppStore((s) => s.tspinCounter);
  const lastTSpin = useAppStore((s) => s.lastTSpin);
  const lastTSpinLines = useAppStore((s) => s.lastTSpinLines);
  const combo = useAppStore((s) => s.combo);
  const comboPulse = useAppStore((s) => s.comboPulse);

  const start = useAppStore((s) => s.start);
  const togglePause = useAppStore((s) => s.togglePause);
  const moveLeft = useAppStore((s) => s.moveLeft);
  const moveRight = useAppStore((s) => s.moveRight);
  const softDrop = useAppStore((s) => s.softDrop);
  const hardDrop = useAppStore((s) => s.hardDrop);
  const rotateCW = useAppStore((s) => s.rotateCW);
  const rotateCCW = useAppStore((s) => s.rotateCCW);
  const swapHold = useAppStore((s) => s.swapHold);
  const tick = useAppStore((s) => s.tick);
  const forceLock = useAppStore((s) => s.forceLock);

  const statusRef = useRef(status);
  statusRef.current = status;

  // Track line-clear events for theme-specific flash overlay
  const prevLinesRef = useRef(lines);
  const [clearPulse, setClearPulse] = useState(0);
  const [clearAmount, setClearAmount] = useState(0);
  useEffect(() => {
    const prev = prevLinesRef.current;
    if (lines > prev) {
      setClearAmount(lines - prev);
      setClearPulse((n) => n + 1);
    }
    prevLinesRef.current = lines;
  }, [lines]);

  // Track T-spin events for the celebratory banner / flash
  const prevTSpinRef = useRef(tspinCounter);
  const [tspinPulse, setTSpinPulse] = useState(0);
  const [tspinPayload, setTSpinPayload] = useState<TSpinPayload>({
    kind: 'none',
    lines: 0,
  });
  useEffect(() => {
    if (tspinCounter > prevTSpinRef.current) {
      setTSpinPayload({ kind: lastTSpin, lines: lastTSpinLines });
      setTSpinPulse((n) => n + 1);
    }
    prevTSpinRef.current = tspinCounter;
  }, [tspinCounter, lastTSpin, lastTSpinLines]);

  // Keyboard input — we own auto-repeat (DAS/ARR) for left/right/soft-drop so
  // input feels snappy regardless of the OS keyboard-repeat settings.
  const repeatsRef = useRef<Map<string, RepeatTimers>>(new Map());
  useEffect(() => {
    const repeats = repeatsRef.current;

    const startRepeat = (
      key: string,
      action: () => void,
      dasMs: number,
      arrMs: number,
    ) => {
      if (repeats.has(key)) return; // already repeating (e.g. OS-level e.repeat)
      action(); // fire once immediately on keydown
      const timers: RepeatTimers = { dasTimer: null, arrTimer: null };
      repeats.set(key, timers);
      const beginArr = () => {
        timers.arrTimer = window.setInterval(action, arrMs);
      };
      if (dasMs <= 0) {
        beginArr();
      } else {
        timers.dasTimer = window.setTimeout(beginArr, dasMs);
      }
    };

    const stopRepeat = (key: string) => {
      const timers = repeats.get(key);
      if (!timers) return;
      if (timers.dasTimer !== null) window.clearTimeout(timers.dasTimer);
      if (timers.arrTimer !== null) window.clearInterval(timers.arrTimer);
      repeats.delete(key);
    };

    const stopAllRepeats = () => {
      for (const key of [...repeats.keys()]) stopRepeat(key);
    };

    const keydown = (e: KeyboardEvent) => {
      // We manage our own repeat for movement keys; OS-driven repeats are noise.
      if (e.repeat) return;

      const currentStatus = statusRef.current;

      if (e.key === 'Enter') {
        e.preventDefault();
        start();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (currentStatus !== 'running') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          stopRepeat('ArrowRight'); // last horizontal press wins
          startRepeat('ArrowLeft', moveLeft, DAS_MS, ARR_MS);
          break;
        case 'ArrowRight':
          e.preventDefault();
          stopRepeat('ArrowLeft');
          startRepeat('ArrowRight', moveRight, DAS_MS, ARR_MS);
          break;
        case 'ArrowDown':
          e.preventDefault();
          startRepeat('ArrowDown', softDrop, 0, SOFT_DROP_MS);
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          rotateCW();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          rotateCCW();
          break;
        case 'Shift':
          e.preventDefault();
          swapHold();
          break;
        default:
          break;
      }
    };

    const keyup = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        stopRepeat(e.key);
      }
    };

    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', stopAllRepeats);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', stopAllRepeats);
      stopAllRepeats();
    };
  }, [
    start,
    togglePause,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    rotateCW,
    rotateCCW,
    swapHold,
  ]);

  // Gravity loop
  useEffect(() => {
    if (status !== 'running') return;
    const interval = gravityIntervalMs(level);
    const id = window.setInterval(() => tick(), interval);
    return () => window.clearInterval(id);
  }, [status, level, tick]);

  // Cancel any in-flight DAS/ARR when leaving `running` so a held key doesn't
  // bleed across pause / game-over into the next piece.
  useEffect(() => {
    if (status === 'running') return;
    const repeats = repeatsRef.current;
    for (const timers of repeats.values()) {
      if (timers.dasTimer !== null) window.clearTimeout(timers.dasTimer);
      if (timers.arrTimer !== null) window.clearInterval(timers.arrTimer);
    }
    repeats.clear();
  }, [status]);

  // Lock-delay scheduler: fires forceLock once when 500ms has elapsed since the
  // piece grounded. Each successful move/rotate while grounded mutates
  // groundedAt → this effect re-runs → previous timer is cancelled and a fresh
  // 500ms window begins.
  useEffect(() => {
    if (status !== 'running' || groundedAt === null) return;
    const remaining = Math.max(0, LOCK_DELAY_MS - (Date.now() - groundedAt));
    const id = window.setTimeout(() => forceLock(), remaining);
    return () => window.clearTimeout(id);
  }, [status, groundedAt, forceLock]);

  const cells = useMemo<RenderedCell[][]>(() => {
    const grid: RenderedCell[][] = Array.from({ length: ROWS }, (_, y) =>
      Array.from({ length: COLS }, (_, x) => ({
        type: board[y][x],
        ghost: null,
      })),
    );

    if (active) {
      const shape = getShape(active.type, active.rotation);
      const ghostOffsetY = ghostY - active.y;

      // Ghost first (so active overrides)
      if (ghostOffsetY > 0) {
        for (let dy = 0; dy < shape.length; dy++) {
          for (let dx = 0; dx < shape[dy].length; dx++) {
            if (!shape[dy][dx]) continue;
            const x = active.x + dx;
            const y = ghostY + dy;
            if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
            if (grid[y][x].type === null) {
              grid[y][x] = { type: null, ghost: active.type };
            }
          }
        }
      }

      for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
          if (!shape[dy][dx]) continue;
          const x = active.x + dx;
          const y = active.y + dy;
          if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
          grid[y][x] = { type: active.type, ghost: null };
        }
      }
    }

    return grid;
  }, [board, active, ghostY]);

  return {
    cells,
    hold,
    canHold,
    queue,
    score,
    level,
    lines,
    highScore,
    status,
    clearPulse,
    clearAmount,
    tspinPulse,
    tspinPayload,
    combo,
    comboPulse,
    onStart: start,
    onResume: togglePause,
  };
}

export type IGameViewModel = ReturnType<typeof useGameViewModel>;
