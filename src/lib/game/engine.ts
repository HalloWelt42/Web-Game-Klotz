import {
  canPlace,
  clearLines,
  cloneBoard,
  cloneObstacles,
  findFirstFit,
  isAnyPlaceable,
  place,
} from './board';
import { levelById } from './levels';
import { MODES, modePool, modeSpecials, pickModeSeed } from './modes';
import { RARITY_WEIGHT, STANDARD_PIECES, pieceById } from './pieces';
import { mulberry32, pickIndex, type Rng } from './rng';
import { scorePlacement } from './score';
import type {
  Board,
  GameMode,
  GameSnapshot,
  GameState,
  Goal,
  ObstacleMap,
  Piece,
  PlaceOutcome,
  Pool,
  PoolSlot,
  Replay,
  ReplayMove,
  SpecialInventory,
  SpecialKind,
} from './types';
import { obstacleKey } from './types';

function makeRng(seed: number): Rng {
  return mulberry32(seed);
}

function pickFromPool(rng: Rng, pool: Piece[]): Piece {
  if (pool.length === 0) throw new Error('empty pool');
  let total = 0;
  for (const p of pool) total += RARITY_WEIGHT[p.rarity] ?? 1;
  let roll = rng() * total;
  for (const p of pool) {
    roll -= RARITY_WEIGHT[p.rarity] ?? 1;
    if (roll <= 0) return p;
  }
  return pool[pool.length - 1];
}

function rollPoolBasic(
  rng: Rng,
  mode: GameMode,
  board?: Board,
  obstacles?: ObstacleMap,
): Pool {
  const standard = modePool(mode);
  const specials = modeSpecials(mode);
  const cfg = MODES[mode];
  // Wenn der Modus eine Solvability-Garantie hat und uns ein Brett
  // bekannt ist, beschränken wir die Auswahl auf Steine, die aktuell
  // ueberhaupt platzierbar sind. Damit kommen z.B. im Shrink keine
  // Pieces, die größer sind als das geschrumpfte Innere.
  const placeable =
    board && cfg.solvabilityGuarantee
      ? standard.filter((p) => findFirstFit(board, p, obstacles ?? {}))
      : standard;
  const pool = placeable.length > 0 ? placeable : standard;

  const slots: PoolSlot[] = [];
  for (let i = 0; i < 3; i++) {
    let piece: Piece;
    if (specials.length > 0 && rng() < cfg.specialChance) {
      piece = pickFromPool(rng, specials);
    } else {
      piece = pickFromPool(rng, pool);
    }
    slots.push({ piece, consumed: false });
  }
  return slots as Pool;
}

function poolHasPlacement(board: Board, obstacles: ObstacleMap, pool: Pool): boolean {
  for (const slot of pool) {
    if (slot.consumed) continue;
    if (findFirstFit(board, slot.piece, obstacles)) return true;
  }
  return false;
}

// Tauscht alle nicht-konsumierten Pool-Slots durch sicher passende Steine
// aus, falls aktuell keiner der verbliebenen Pieces noch ins Brett passt.
// Wird nach jedem Schrumpf-Tick aufgerufen, weil dort das Brett kleiner
// werden kann und vorher passende Steine plötzlich blockiert sind.
function ensurePoolPlacementForBoard(state: GameState): GameState {
  if (poolHasPlacement(state.board, state.obstacles, state.pool)) return state;
  const rng = deriveRngForState(state);
  const newPool = state.pool.map((slot) => slot) as Pool;
  let replaced = false;
  for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
    if (newPool[slotIdx].consumed) continue;
    for (let attempt = 0; attempt < 80; attempt++) {
      const candidate = pickFromPool(rng, STANDARD_PIECES);
      if (findFirstFit(state.board, candidate, state.obstacles)) {
        newPool[slotIdx] = { piece: candidate, consumed: false };
        replaced = true;
        break;
      }
    }
  }
  return replaced ? { ...state, pool: newPool } : state;
}

export function rollPool(
  rng: Rng,
  mode: GameMode,
  board?: Board,
  obstacles?: ObstacleMap,
): Pool {
  // Pool-Filterung wird in rollPoolBasic gemacht, wenn der Modus eine
  // Solvability-Garantie hat -- separate Versuchsschleifen sind dadurch
  // unnötig.
  return rollPoolBasic(rng, mode, board, obstacles);
}

export type NewGameOptions = {
  rotationOverride?: boolean;
  boardSizeOverride?: number;
};

function generateObstacles(
  rng: Rng,
  size: number,
  blockCount: number,
  iceCount: number,
): ObstacleMap {
  const obstacles: ObstacleMap = {};
  let placed = 0;
  while (placed < blockCount) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    const k = `${x},${y}`;
    if (!obstacles[k]) {
      obstacles[k] = 'block';
      placed += 1;
    }
  }
  let placedIce = 0;
  while (placedIce < iceCount) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    const k = `${x},${y}`;
    if (!obstacles[k]) {
      obstacles[k] = 'ice';
      placedIce += 1;
    }
  }
  return obstacles;
}

export function newGame(
  mode: GameMode = 'endless',
  seedOverride?: number,
  levelId?: string,
  opts: NewGameOptions = {},
): GameState {
  const cfg = MODES[mode];
  const seed = seedOverride ?? pickModeSeed(mode);
  const rng = makeRng(seed);
  // Levels haben fixe Setups; alle anderen Modi können die Brettgröße überschreiben.
  const boardSize = mode === 'level' ? cfg.boardSize : opts.boardSizeOverride ?? cfg.boardSize;
  let setup = cfg.initialBoard(rng, boardSize);
  let goal = cfg.goal ? { ...cfg.goal } : undefined;

  if (mode === 'level' && levelId) {
    const level = levelById(levelId);
    if (level) {
      const obstacles = generateObstacles(rng, cfg.boardSize, level.blockCount, level.iceCount);
      setup = { board: setup.board, obstacles };
      goal = { ...level.goal, moves: level.movesLimit };
    }
  }

  const pool = rollPool(rng, mode, setup.board, setup.obstacles);
  const replay: Replay = { seed, mode, levelId, moves: [] };
  const rotationAllowed = opts.rotationOverride ?? cfg.rotationAllowed;
  return {
    mode,
    levelId,
    seed,
    boardSize,
    board: setup.board,
    obstacles: setup.obstacles,
    pool,
    specials: cfg.initialSpecials ? { ...cfg.initialSpecials } : { bomb: 0, hammer: 0, joker: 0 },
    score: 0,
    combo: 0,
    streak: 0,
    undoUsed: false,
    skipUsed: false,
    history: [],
    status: 'running',
    startedAt: Date.now(),
    movesCount: 0,
    rowsCleared: 0,
    colsCleared: 0,
    goal,
    timeLimit: cfg.timeLimit,
    timeLeft: cfg.timeLimit,
    rotationAllowed,
    solvabilityGuarantee: cfg.solvabilityGuarantee,
    shrinking: cfg.shrinking,
    replay,
  };
}

function snapshot(state: GameState): GameSnapshot {
  return {
    board: cloneBoard(state.board),
    pool: state.pool.map((s) => ({ piece: s.piece, consumed: s.consumed })) as Pool,
    obstacles: cloneObstacles(state.obstacles),
    score: state.score,
    combo: state.combo,
    streak: state.streak,
    movesCount: state.movesCount,
    rowsCleared: state.rowsCleared,
    colsCleared: state.colsCleared,
  };
}

function deriveRngForState(state: GameState): Rng {
  return makeRng((state.seed ^ (state.movesCount * 0x9e3779b1)) >>> 0);
}

function refillIfEmpty(state: GameState): GameState {
  if (state.pool.every((s) => s.consumed)) {
    const rng = deriveRngForState(state);
    return {
      ...state,
      pool: rollPool(rng, state.mode, state.board, state.obstacles),
    };
  }
  return state;
}

// Variabel: Erstes Schrumpfen kommt spät (30 Züge -- Anfänger-Phase),
// danach immer schneller. So fühlt es sich anfangs nicht erstickt an,
// wird aber im Endspiel druckvoll.
//   Ring 0 -> 1 nach 30 Zügen
//   Ring 1 -> 2 nach weiteren 25 (gesamt 55)
//   Ring 2 -> 3 nach weiteren 20 (gesamt 75)
//   Ring 3 -> 4 nach weiteren 15 (gesamt 90)
//   Ring 4 -> 5 nach weiteren 10 (gesamt 100, falls ringCap das zulässt)
function shrinkIntervalForRing(ring: number): number {
  return Math.max(10, 30 - ring * 5);
}

function ringForMoves(movesCount: number, ringCap: number): number {
  let total = 0;
  for (let r = 0; r < ringCap; r++) {
    total += shrinkIntervalForRing(r);
    if (movesCount < total) return r;
  }
  return ringCap;
}

function shrinkIfNeeded(state: GameState): GameState {
  if (!state.shrinking) return state;
  const size = state.boardSize;
  // Mindestinnenfläche 2x2 -- darunter wäre die Partie aussichtslos.
  const ringCap = Math.max(0, Math.floor((size - 2) / 2));
  const ring = ringForMoves(state.movesCount, ringCap);
  if (ring === 0) return state;
  // Erkennen, ob in genau diesem Zug eine neue Schrumpfstufe gegriffen hat.
  const previousRing = ringForMoves(Math.max(0, state.movesCount - 1), ringCap);
  const justShrunk = ring > previousRing;

  const obs: ObstacleMap = cloneObstacles(state.obstacles);
  for (let r = 0; r < ring; r++) {
    for (let i = r; i < size - r; i++) {
      obs[obstacleKey(i, r)] = 'block';
      obs[obstacleKey(i, size - 1 - r)] = 'block';
      obs[obstacleKey(r, i)] = 'block';
      obs[obstacleKey(size - 1 - r, i)] = 'block';
    }
  }
  const board = cloneBoard(state.board);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      if (obs[obstacleKey(x, y)] === 'block') board[y][x] = null;
    }
  // Schrumpft das Brett gerade -- Combo abbrechen, damit kein
  // unendlicher Combo-Aufbau mehr möglich ist. Außerdem den Pool
  // revalidieren: durch das engere Innere können vorher passende
  // Pieces blockiert sein -- die werden gegen passende ausgetauscht.
  if (justShrunk) {
    let next: GameState = { ...state, obstacles: obs, board, combo: 0 };
    // Wenn die Innenfläche jetzt das 2x2-Minimum erreicht, ist die
    // Partie zu Ende -- weitermachen wäre ein endloses Setzen kleiner
    // Steine ohne wirkliche Spannung.
    if (ring === ringCap && ring > 0) {
      return { ...next, status: 'gameover' };
    }
    next = ensurePoolPlacementForBoard(next);
    return next;
  }
  return { ...state, obstacles: obs, board };
}

function checkGoalReached(state: GameState): boolean {
  if (!state.goal) return false;
  const g: Goal = state.goal;
  if (g.points && state.score >= g.points) return true;
  if (g.rows && state.rowsCleared >= g.rows) return true;
  if (g.cols && state.colsCleared >= g.cols) return true;
  if (g.clears && state.rowsCleared + state.colsCleared >= g.clears) return true;
  return false;
}

function checkGoalFailed(state: GameState): boolean {
  if (!state.goal) return false;
  if (state.goal.moves && state.movesCount >= state.goal.moves) {
    return !checkGoalReached(state);
  }
  return false;
}

export function hasAnySpecial(specials: SpecialInventory): boolean {
  return specials.bomb > 0 || specials.hammer > 0 || specials.joker > 0;
}

export function isStuckButRescuable(state: GameState): boolean {
  if (state.status !== 'running') return false;
  return (
    !isAnyPlaceable(state.board, state.pool, state.obstacles) &&
    hasAnySpecial(state.specials)
  );
}

// Combo-Schwellen für Special-Vergabe -- bewusst seltener als früher
// (war 2/3/4), damit Pools nicht in Specials ertrinken.
export const COMBO_BOMB = 3;
export const COMBO_HAMMER = 5;
export const COMBO_JOKER = 7;

// Hard Cap pro Special-Sorte. Mehr darf der Spieler nicht horten --
// sonst sind Specials nur noch Bequemlichkeit, nicht Lebensretter.
export const SPECIAL_CAP = 2;

function bumpSpecial(
  specials: SpecialInventory,
  kind: SpecialKind,
  by: number = 1,
): SpecialInventory {
  return { ...specials, [kind]: Math.min(SPECIAL_CAP, specials[kind] + by) };
}

function awardSpecialsForCombo(combo: number, specials: SpecialInventory): SpecialInventory {
  if (combo === COMBO_BOMB) return bumpSpecial(specials, 'bomb');
  if (combo === COMBO_HAMMER) return bumpSpecial(specials, 'hammer');
  if (combo === COMBO_JOKER) return bumpSpecial(specials, 'joker');
  if (combo === 10) return bumpSpecial(bumpSpecial(specials, 'bomb'), 'hammer');
  if (combo === 14) return bumpSpecial(bumpSpecial(specials, 'joker'), 'bomb');
  return specials;
}

// Linien-Meilensteine sind brettgrößen-skaliert: wir zählen die ungefähre
// Anzahl geräumter Zellen (Linien * boardSize) und vergeben nach Schwellen.
// So fühlt sich der Bonus auf 6x6 nicht plötzlich doppelt so freigiebig an
// wie auf 12x12, weil eine 6er-Reihe weniger Zellen pro Linie freigibt.
export const CELLS_PER_BOMB = 60;
export const CELLS_PER_HAMMER = 130;
export const CELLS_PER_JOKER = 260;

function awardSpecialsForLineMilestone(
  prevLines: number,
  newLines: number,
  boardSize: number,
  specials: SpecialInventory,
): SpecialInventory {
  let next = specials;
  const prevCells = prevLines * boardSize;
  const newCells = newLines * boardSize;

  if (Math.floor(newCells / CELLS_PER_BOMB) > Math.floor(prevCells / CELLS_PER_BOMB)) {
    next = bumpSpecial(next, 'bomb');
  }
  if (Math.floor(newCells / CELLS_PER_HAMMER) > Math.floor(prevCells / CELLS_PER_HAMMER)) {
    next = bumpSpecial(next, 'hammer');
  }
  if (Math.floor(newCells / CELLS_PER_JOKER) > Math.floor(prevCells / CELLS_PER_JOKER)) {
    next = bumpSpecial(next, 'joker');
  }
  return next;
}

function applyPlacement(
  state: GameState,
  piece: Piece,
  x: number,
  y: number,
  options: {
    consumePoolSlot?: 0 | 1 | 2;
    consumeSpecial?: SpecialKind;
    move: ReplayMove;
  },
): PlaceOutcome | null {
  if (!canPlace(state.board, piece, x, y, state.obstacles)) return null;
  const placed = place(state.board, piece, x, y, state.obstacles);
  const cleared = clearLines(placed.board, placed.obstacles);

  const breakdown = scorePlacement(
    piece,
    cleared.clearedRows.length,
    cleared.clearedCols.length,
    state.combo,
    cleared.monochromeBonusLines,
  );
  const willCombo = cleared.clearedRows.length + cleared.clearedCols.length > 0;
  const newCombo = willCombo ? state.combo + 1 : 0;
  const newStreak = Math.max(state.streak, newCombo);

  let newPool = state.pool;
  if (options.consumePoolSlot !== undefined) {
    const idx = options.consumePoolSlot;
    newPool = state.pool.map((s, i) =>
      i === idx ? { ...s, consumed: true } : s,
    ) as Pool;
  }

  let newSpecials = state.specials;
  if (options.consumeSpecial) {
    const k = options.consumeSpecial;
    newSpecials = { ...newSpecials, [k]: Math.max(0, newSpecials[k] - 1) };
  }
  newSpecials = awardSpecialsForCombo(newCombo, newSpecials);
  const prevTotalLines = state.rowsCleared + state.colsCleared;
  const newTotalLines = prevTotalLines + cleared.clearedRows.length + cleared.clearedCols.length;
  newSpecials = awardSpecialsForLineMilestone(
    prevTotalLines,
    newTotalLines,
    state.boardSize,
    newSpecials,
  );

  let next: GameState = {
    ...state,
    board: cleared.board,
    obstacles: cleared.obstacles,
    pool: newPool,
    specials: newSpecials,
    score: state.score + breakdown.total,
    combo: newCombo,
    streak: newStreak,
    movesCount: state.movesCount + 1,
    rowsCleared: state.rowsCleared + cleared.clearedRows.length,
    colsCleared: state.colsCleared + cleared.clearedCols.length,
    history: [snapshot(state)],
    replay: { ...state.replay, moves: [...state.replay.moves, options.move] },
  };

  next = refillIfEmpty(next);
  next = shrinkIfNeeded(next);

  if (checkGoalReached(next)) {
    next = { ...next, status: 'won' };
  } else if (checkGoalFailed(next)) {
    next = { ...next, status: 'gameover' };
  } else if (
    !isAnyPlaceable(next.board, next.pool, next.obstacles) &&
    !hasAnySpecial(next.specials)
  ) {
    next = { ...next, status: 'gameover' };
  }

  return {
    state: next,
    cleared: { rows: cleared.clearedRows, cols: cleared.clearedCols },
    pointsGained: breakdown.total,
    monochromeBonusLines: cleared.monochromeBonusLines,
  };
}

export function tryPlace(
  state: GameState,
  slotIndex: 0 | 1 | 2,
  x: number,
  y: number,
): PlaceOutcome | null {
  if (state.status !== 'running') return null;
  const slot = state.pool[slotIndex];
  if (!slot || slot.consumed) return null;
  return applyPlacement(state, slot.piece, x, y, {
    consumePoolSlot: slotIndex,
    move: { slot: slotIndex, pieceId: slot.piece.id, x, y },
  });
}

const SPECIAL_PIECE_ID: Record<SpecialKind, string> = {
  bomb: 'SP_BOMB',
  hammer: 'SP_HAMMER',
  joker: 'SP_JOKER',
};

function canUseSpecial(state: GameState, kind: SpecialKind): boolean {
  return state.status === 'running' && (state.specials[kind] ?? 0) > 0;
}

export function tryUseSpecial(
  state: GameState,
  kind: SpecialKind,
  x: number,
  y: number,
): PlaceOutcome | null {
  if (!canUseSpecial(state, kind)) return null;
  const piece = pieceById(SPECIAL_PIECE_ID[kind]);
  if (!piece) return null;
  return applyPlacement(state, piece, x, y, {
    consumeSpecial: kind,
    move: { slot: 0, pieceId: piece.id, x, y },
  });
}

export function canUndo(state: GameState): boolean {
  return !state.undoUsed && state.history.length > 0 && state.status === 'running';
}

export function undo(state: GameState): GameState {
  if (!canUndo(state)) return state;
  const last = state.history[state.history.length - 1];
  return {
    ...state,
    board: last.board,
    obstacles: last.obstacles,
    pool: last.pool,
    score: last.score,
    combo: last.combo,
    streak: last.streak,
    movesCount: last.movesCount,
    rowsCleared: last.rowsCleared,
    colsCleared: last.colsCleared,
    undoUsed: true,
    history: [],
    status: 'running',
  };
}

export function canSkip(state: GameState, slotIndex: 0 | 1 | 2): boolean {
  if (state.skipUsed || state.status !== 'running') return false;
  const slot = state.pool[slotIndex];
  return Boolean(slot && !slot.consumed);
}

const SKIP_COST = 5;

export function skip(state: GameState, slotIndex: 0 | 1 | 2): GameState {
  if (!canSkip(state, slotIndex)) return state;
  const rng = deriveRngForState(state);
  const replacement = STANDARD_PIECES[pickIndex(rng, STANDARD_PIECES.length)];
  const newPool = state.pool.map((s, i) =>
    i === slotIndex ? { piece: replacement, consumed: false } : s,
  ) as Pool;
  let next: GameState = {
    ...state,
    pool: newPool,
    score: Math.max(0, state.score - SKIP_COST),
    skipUsed: true,
  };
  if (!isAnyPlaceable(next.board, next.pool, next.obstacles) && !hasAnySpecial(next.specials)) {
    next = { ...next, status: 'gameover' };
  }
  return next;
}

export function tickTimer(state: GameState, deltaSeconds: number): GameState {
  if (state.status !== 'running' || state.timeLeft === undefined) return state;
  const newTime = Math.max(0, state.timeLeft - deltaSeconds);
  if (newTime === 0) {
    return { ...state, timeLeft: 0, status: 'gameover' };
  }
  return { ...state, timeLeft: newTime };
}

export function rotatePieceInSlot(state: GameState, slotIndex: 0 | 1 | 2): GameState {
  if (!state.rotationAllowed) return state;
  const slot = state.pool[slotIndex];
  if (!slot || slot.consumed || slot.piece.kind !== 'standard') return state;
  const rotated = rotateById(slot.piece.id);
  if (!rotated) return state;
  const newPool = state.pool.map((s, i) =>
    i === slotIndex ? { ...s, piece: rotated } : s,
  ) as Pool;
  return { ...state, pool: newPool };
}

const ROTATION_PARTNERS: Record<string, string> = {
  I2H: 'I2V',
  I2V: 'I2H',
  I3H: 'I3V',
  I3V: 'I3H',
  I4H: 'I4V',
  I4V: 'I4H',
  I5H: 'I5V',
  I5V: 'I5H',
  L_NE: 'L_NW',
  L_NW: 'L_SW',
  L_SW: 'L_SE',
  L_SE: 'L_NE',
  L3_NE: 'L3_NW',
  L3_NW: 'L3_SW',
  L3_SW: 'L3_SE',
  L3_SE: 'L3_NE',
};

function rotateById(id: string): Piece | null {
  const target = ROTATION_PARTNERS[id];
  return target ? pieceById(target) ?? null : null;
}

export function newFromReplay(replay: Replay): GameState {
  let state = newGame(replay.mode, replay.seed, replay.levelId);
  for (const m of replay.moves) {
    const slotPiece = state.pool[m.slot]?.piece;
    if (!slotPiece || slotPiece.id !== m.pieceId) break;
    const out = tryPlace(state, m.slot, m.x, m.y);
    if (!out) break;
    state = out.state;
  }
  return state;
}
