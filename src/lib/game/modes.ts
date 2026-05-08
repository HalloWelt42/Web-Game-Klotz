import { emptyBoard, fillBoardRandom } from './board';
import { STANDARD_PIECES, SPECIAL_PIECES } from './pieces';
import type { Rng } from './rng';
import { dailySeed, randomSeed } from './rng';
import type { Board, GameMode, Goal, ObstacleMap, Piece, SpecialInventory } from './types';
import { obstacleKey } from './types';

export type ModeConfig = {
  id: GameMode;
  label: string;
  description: string;
  icon: string;
  boardSize: number;
  poolFilter: (piece: Piece) => boolean;
  specialChance: number;
  goal?: Goal;
  timeLimit?: number;
  rotationAllowed: boolean;
  shrinking: boolean;
  solvabilityGuarantee: boolean;
  initialBoard: (rng: Rng, size: number) => { board: Board; obstacles: ObstacleMap };
  pickSeed?: () => number;
  initialSpecials?: SpecialInventory;
};

function emptySetup(size: number): { board: Board; obstacles: ObstacleMap } {
  return { board: emptyBoard(size), obstacles: {} };
}

function reverseSetup(rng: Rng, size: number): { board: Board; obstacles: ObstacleMap } {
  return { board: fillBoardRandom(rng, size, 0.62), obstacles: {} };
}

function levelSetupWithObstacles(
  rng: Rng,
  size: number,
  blockCount: number,
  iceCount: number,
): { board: Board; obstacles: ObstacleMap } {
  const obstacles: ObstacleMap = {};
  let placed = 0;
  while (placed < blockCount) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    const k = obstacleKey(x, y);
    if (!obstacles[k]) {
      obstacles[k] = 'block';
      placed += 1;
    }
  }
  let placedIce = 0;
  while (placedIce < iceCount) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    const k = obstacleKey(x, y);
    if (!obstacles[k]) {
      obstacles[k] = 'ice';
      placedIce += 1;
    }
  }
  return { board: emptyBoard(size), obstacles };
}

export const MODES: Record<GameMode, ModeConfig> = {
  endless: {
    id: 'endless',
    label: 'Endless',
    description: 'Spielen, bis nichts mehr passt.',
    icon: 'fa-infinity',
    boardSize: 10,
    poolFilter: () => true,
    specialChance: 0,
    rotationAllowed: false,
    shrinking: false,
    solvabilityGuarantee: true,
    initialBoard: (_rng, size) => emptySetup(size),
  },
  daily: {
    id: 'daily',
    label: 'Tages-Challenge',
    description: 'Pro Tag eine feste Steinfolge -- dein Tagesergebnis im 30-Tage-Verlauf.',
    icon: 'fa-calendar-day',
    boardSize: 10,
    poolFilter: () => true,
    specialChance: 0,
    rotationAllowed: false,
    shrinking: false,
    solvabilityGuarantee: false,
    initialBoard: (_rng, size) => emptySetup(size),
    pickSeed: () => dailySeed(),
  },
  level: {
    id: 'level',
    label: 'Levels',
    description: 'Klare Ziele in begrenzter Zugzahl.',
    icon: 'fa-flag-checkered',
    boardSize: 10,
    poolFilter: () => true,
    specialChance: 0,
    rotationAllowed: false,
    shrinking: false,
    solvabilityGuarantee: true,
    initialBoard: (rng, size) => levelSetupWithObstacles(rng, size, 6, 4),
    goal: { points: 250, moves: 25 },
  },
  timed: {
    id: 'timed',
    label: 'Zeitrennen',
    description: '180 Sekunden, so viele Punkte wie möglich.',
    icon: 'fa-stopwatch',
    boardSize: 10,
    poolFilter: () => true,
    specialChance: 0,
    rotationAllowed: false,
    shrinking: false,
    solvabilityGuarantee: true,
    initialBoard: (_rng, size) => emptySetup(size),
    timeLimit: 180,
  },
  reverse: {
    id: 'reverse',
    label: 'Reverse',
    description: 'Brett ist voll. Räume alle Linien, bevor der Pool ausgeht.',
    icon: 'fa-rotate-left',
    boardSize: 10,
    poolFilter: () => true,
    specialChance: 0,
    rotationAllowed: false,
    shrinking: false,
    solvabilityGuarantee: true,
    initialBoard: reverseSetup,
    goal: { clears: 8 },
    // Marker-Wert: tatsaechlich wird das brettgr-abh. Cap als
    // Start-Vorrat verwendet (siehe newGame). 99 ist ein hoher
    // Wert, der vom Clamp ohnehin auf cap gedeckelt wird.
    initialSpecials: { bomb: 99, hammer: 99, joker: 99 },
  },
  shrink: {
    id: 'shrink',
    label: 'Shrink',
    description: 'Brett schrumpft mit der Zeit. Wer am längsten überlebt, gewinnt.',
    icon: 'fa-compress',
    boardSize: 10,
    poolFilter: () => true,
    // Keine Pool-Specials in Shrink: Sie würden zusätzliche Specials
    // erzeugen (durch Linien-Räumung beim Setzen) und so wirken,
    // als ob "grundlos" Bonus hochgezählt wird.
    specialChance: 0,
    rotationAllowed: false,
    shrinking: true,
    solvabilityGuarantee: true,
    initialBoard: (_rng, size) => emptySetup(size),
  },
};

export function modePool(mode: GameMode): Piece[] {
  const cfg = MODES[mode];
  return STANDARD_PIECES.filter(cfg.poolFilter);
}

export function modeSpecials(mode: GameMode): Piece[] {
  const cfg = MODES[mode];
  return cfg.specialChance > 0 ? SPECIAL_PIECES : [];
}

export function pickModeSeed(mode: GameMode): number {
  const cfg = MODES[mode];
  return cfg.pickSeed ? cfg.pickSeed() : randomSeed();
}
