// Domain Gatekeeper — UI layer must ONLY import from this barrel file.

export type {
  Board,
  Cell,
  GameStateDto,
  GameStatus,
  LastAction,
  LockDelayState,
  Piece,
  PieceType,
  Rotation,
  TSpinKind,
} from './services/tetris/types';

export { COLS, ROWS } from './constants/board';
export {
  PIECE_TYPES,
  SPAWN_X,
  SPAWN_Y,
  getShape,
} from './constants/tetrominoes';
export type { ShapeMatrix } from './constants/tetrominoes';

export {
  createEmptyBoard,
  isCollision,
  lockPiece,
  clearLines,
} from './services/tetris/board';

export {
  spawnPiece,
  move,
  tryMove,
  tryRotate,
  hardDropDistance,
  ghostPosition,
} from './services/tetris/piece';
export type { RotateResult } from './services/tetris/piece';

export { createBag, refillIfNeeded, takeNext } from './services/tetris/bag';

export {
  computeLineScore,
  levelFromLines,
  gravityIntervalMs,
} from './services/tetris/scoring';
export type { ScoreInputs } from './services/tetris/scoring';

export {
  advanceTickUsecase,
  forceLockUsecase,
  hardDropUsecase,
  lockAndAdvance,
  noteAction,
  spawnNext,
} from './services/tetris/tick.usecase';

export { detectTSpin } from './services/tetris/tspin';

export {
  SOFT_DROP_POINT,
  HARD_DROP_POINT,
  LINES_PER_LEVEL,
} from './constants/scoring';

export {
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
} from './constants/lockDelay';
