export const LINE_SCORES: readonly number[] = [0, 100, 300, 500, 800];

export const SOFT_DROP_POINT = 1;
export const HARD_DROP_POINT = 2;

export const LINES_PER_LEVEL = 10;

const GRAVITY_TABLE: readonly number[] = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100, 80, 80, 80, 70, 70, 70, 50,
  50, 50, 30, 30,
];

export function gravityIntervalMs(level: number): number {
  const idx = Math.min(Math.max(level - 1, 0), GRAVITY_TABLE.length - 1);
  return GRAVITY_TABLE[idx];
}
