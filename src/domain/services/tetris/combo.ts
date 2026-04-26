export function nextCombo(prevCombo: number, linesCleared: number): number {
  if (linesCleared === 0) return -1;
  return prevCombo + 1;
}

export function computeComboBonus(combo: number, level: number): number {
  if (combo < 1) return 0;
  return 50 * combo * level;
}
