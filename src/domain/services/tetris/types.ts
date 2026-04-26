export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Cell = PieceType | null;

export type Board = Cell[][];

export type Rotation = 0 | 1 | 2 | 3;

export interface Piece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type GameStatus = 'idle' | 'running' | 'paused' | 'gameover';

export type LastAction =
  | 'spawn'
  | 'move'
  | 'rotate'
  | 'softDrop'
  | 'hardDrop'
  | 'hold';

export type TSpinKind = 'none' | 'mini' | 'tspin';

export interface LockDelayState {
  groundedAt: number | null;
  resets: number;
  pausedElapsedMs: number;
}

export interface GameStateDto {
  board: Board;
  active: Piece | null;
  ghostY: number;
  hold: PieceType | null;
  canHold: boolean;
  queue: PieceType[];
  bag: PieceType[];
  score: number;
  level: number;
  lines: number;
  status: GameStatus;
  highScore: number;
  lastAction: LastAction;
  lastKickIndex: number;
  lockDelay: LockDelayState;
  lastTSpin: TSpinKind;
  lastTSpinLines: number;
  tspinCounter: number;
  combo: number;
  comboPulse: number;
}
