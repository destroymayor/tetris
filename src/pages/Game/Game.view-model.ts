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

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat && (e.key === ' ' || e.key === 'Enter' || e.key === 'Shift' || e.key === 'p' || e.key === 'P')) {
        return;
      }

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
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
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

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
    onStart: start,
    onResume: togglePause,
  };
}

export type IGameViewModel = ReturnType<typeof useGameViewModel>;
