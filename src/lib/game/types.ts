export const DEFAULT_BOARD_SIZE = 10;
export const BOARD_SIZE = DEFAULT_BOARD_SIZE;

export type Cell = string | null;
export type Board = Cell[][];

export type Coord = [number, number];

export type ObstacleKind = 'block' | 'ice';
export type ObstacleMap = Record<string, ObstacleKind>;

export type PieceKind = 'standard' | 'bomb' | 'hammer' | 'joker';
export type PieceRarity = 'common' | 'uncommon' | 'rare';

export type Piece = {
  id: string;
  cells: Coord[];
  width: number;
  height: number;
  colorToken: string;
  kind: PieceKind;
  rarity: PieceRarity;
};

export type PoolSlot = { piece: Piece; consumed: boolean };
export type Pool = [PoolSlot, PoolSlot, PoolSlot];

export type GameMode = 'endless' | 'daily' | 'level' | 'timed' | 'reverse' | 'shrink';

export type GameSnapshot = {
  board: Board;
  pool: Pool;
  obstacles: ObstacleMap;
  score: number;
  combo: number;
  streak: number;
  movesCount: number;
  rowsCleared: number;
  colsCleared: number;
};

export type GameStatus = 'running' | 'gameover' | 'won';

export type SpecialKind = 'bomb' | 'hammer' | 'joker';
export type SpecialInventory = Record<SpecialKind, number>;

export type Goal = {
  points?: number;
  rows?: number;
  cols?: number;
  clears?: number;
  moves?: number;
};

export type ReplayMove = {
  slot: 0 | 1 | 2;
  pieceId: string;
  x: number;
  y: number;
  rotation?: 0 | 1 | 2 | 3;
};

export type Replay = {
  seed: number;
  mode: GameMode;
  levelId?: string;
  moves: ReplayMove[];
};

export type GameState = {
  mode: GameMode;
  levelId?: string;
  seed: number;
  boardSize: number;
  board: Board;
  obstacles: ObstacleMap;
  pool: Pool;
  specials: SpecialInventory;
  score: number;
  combo: number;
  streak: number;
  undoUsed: boolean;
  skipUsed: boolean;
  history: GameSnapshot[];
  status: GameStatus;
  startedAt: number;
  movesCount: number;
  rowsCleared: number;
  colsCleared: number;
  goal?: Goal;
  timeLimit?: number;
  timeLeft?: number;
  rotationAllowed: boolean;
  solvabilityGuarantee: boolean;
  shrinking: boolean;
  replay: Replay;
};

export type ClearResult = {
  board: Board;
  obstacles: ObstacleMap;
  clearedRows: number[];
  clearedCols: number[];
  monochromeBonusLines: number;
};

export type PlaceOutcome = {
  state: GameState;
  cleared: { rows: number[]; cols: number[] };
  pointsGained: number;
  monochromeBonusLines: number;
};

export type LifetimeStats = {
  gamesPlayed: number;
  totalPoints: number;
  highestCombo: number;
  longestStreak: number;
  rowsCleared: number;
  colsCleared: number;
  heatmap: number[][];
  perGameHigh: Record<GameMode, number>;
  achievements: string[];
  dailyScores: { date: string; score: number }[];
  completedLevels: string[];
  levelStars: Record<string, number>;
};

export type BoardSize = 6 | 8 | 10 | 12;

export type Settings = {
  theme: 'system' | 'light' | 'dark';
  palette: 'default' | 'warm' | 'cool' | 'forest' | 'winter' | 'halloween';
  colorblind: boolean;
  sound: boolean;
  haptics: boolean;
  boardSize: BoardSize;
  modeHintsShown: GameMode[];
};

export type Profile = {
  pseudonym: string;
  createdAt: number;
};

export const obstacleKey = (x: number, y: number): string => `${x},${y}`;
