import {
  LINE_SCORES,
  LINES_PER_LEVEL,
  gravityIntervalMs as gravity,
} from '@/domain/constants/scoring';
import type { TSpinKind } from './types';

export interface ScoreInputs {
  linesCleared: number;
  level: number;
  tspin: TSpinKind;
}

const TSPIN_SCORES = [400, 800, 1200, 1600] as const;
const TSPIN_MINI_SCORES = [100, 200, 400] as const;

export function computeLineScore(input: ScoreInputs): number {
  const { linesCleared, level, tspin } = input;
  if (tspin === 'tspin') {
    const base = TSPIN_SCORES[Math.min(linesCleared, TSPIN_SCORES.length - 1)];
    return base * level;
  }
  if (tspin === 'mini') {
    const base = TSPIN_MINI_SCORES[Math.min(linesCleared, TSPIN_MINI_SCORES.length - 1)];
    return base * level;
  }
  const base = LINE_SCORES[Math.min(linesCleared, LINE_SCORES.length - 1)];
  return base * level;
}

export function levelFromLines(totalLines: number): number {
  return 1 + Math.floor(totalLines / LINES_PER_LEVEL);
}

export function gravityIntervalMs(level: number): number {
  return gravity(level);
}
