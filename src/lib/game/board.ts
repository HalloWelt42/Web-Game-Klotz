import { DEFAULT_BOARD_SIZE, obstacleKey } from './types';
import type { Board, ClearResult, ObstacleMap, Piece, Pool } from './types';

export function emptyBoard(size: number = DEFAULT_BOARD_SIZE): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null as null),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice() as Board[number]);
}

export function cloneObstacles(obs: ObstacleMap): ObstacleMap {
  return { ...obs };
}

export function boardSizeOf(board: Board): number {
  return board.length;
}

export function inBounds(size: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size;
}

export function canPlace(
  board: Board,
  piece: Piece,
  x: number,
  y: number,
  obstacles: ObstacleMap = {},
): boolean {
  const size = boardSizeOf(board);
  if (piece.kind === 'hammer' || piece.kind === 'bomb') {
    return inBounds(size, x, y);
  }
  if (piece.kind === 'joker') {
    return inBounds(size, x, y) && board[y][x] === null && !obstacles[obstacleKey(x, y)];
  }
  for (const [dx, dy] of piece.cells) {
    const px = x + dx;
    const py = y + dy;
    if (!inBounds(size, px, py)) return false;
    if (board[py][px] !== null) return false;
    const k = obstacleKey(px, py);
    if (obstacles[k] === 'block' || obstacles[k] === 'ice') return false;
  }
  return true;
}

export function place(
  board: Board,
  piece: Piece,
  x: number,
  y: number,
  obstacles: ObstacleMap = {},
): { board: Board; obstacles: ObstacleMap; specialEffect?: 'bomb' | 'hammer' | 'joker' } {
  if (piece.kind === 'bomb') {
    const next = cloneBoard(board);
    const obs = cloneObstacles(obstacles);
    const size = boardSizeOf(board);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (!inBounds(size, px, py)) continue;
        next[py][px] = null;
        delete obs[obstacleKey(px, py)];
      }
    }
    return { board: next, obstacles: obs, specialEffect: 'bomb' };
  }
  if (piece.kind === 'hammer') {
    const next = cloneBoard(board);
    const obs = cloneObstacles(obstacles);
    const size = boardSizeOf(board);
    if (inBounds(size, x, y)) {
      next[y][x] = null;
      delete obs[obstacleKey(x, y)];
    }
    return { board: next, obstacles: obs, specialEffect: 'hammer' };
  }
  if (piece.kind === 'joker') {
    const next = cloneBoard(board);
    next[y][x] = piece.colorToken;
    return { board: next, obstacles: cloneObstacles(obstacles), specialEffect: 'joker' };
  }
  const next = cloneBoard(board);
  for (const [dx, dy] of piece.cells) {
    next[y + dy][x + dx] = piece.colorToken;
  }
  return { board: next, obstacles: cloneObstacles(obstacles) };
}

export function fullRows(board: Board, obstacles: ObstacleMap = {}): number[] {
  const size = boardSizeOf(board);
  const rows: number[] = [];
  for (let y = 0; y < size; y++) {
    let full = true;
    for (let x = 0; x < size; x++) {
      const k = obstacleKey(x, y);
      if (obstacles[k] === 'block') {
        continue;
      }
      if (board[y][x] === null) {
        full = false;
        break;
      }
    }
    if (full) rows.push(y);
  }
  return rows;
}

export function fullCols(board: Board, obstacles: ObstacleMap = {}): number[] {
  const size = boardSizeOf(board);
  const cols: number[] = [];
  for (let x = 0; x < size; x++) {
    let full = true;
    for (let y = 0; y < size; y++) {
      const k = obstacleKey(x, y);
      if (obstacles[k] === 'block') {
        continue;
      }
      if (board[y][x] === null) {
        full = false;
        break;
      }
    }
    if (full) cols.push(x);
  }
  return cols;
}

function isLineMonochrome(board: Board, indices: number[], axis: 'row' | 'col'): boolean {
  const size = boardSizeOf(board);
  for (const idx of indices) {
    let firstColor: string | null = null;
    let mono = true;
    for (let k = 0; k < size; k++) {
      const cell = axis === 'row' ? board[idx][k] : board[k][idx];
      if (!cell) continue;
      if (firstColor === null) firstColor = cell;
      else if (cell !== firstColor) {
        mono = false;
        break;
      }
    }
    if (!mono || firstColor === null) return false;
  }
  return true;
}

export function clearLines(board: Board, obstacles: ObstacleMap = {}): ClearResult {
  const clearedRows = fullRows(board, obstacles);
  const clearedCols = fullCols(board, obstacles);
  if (clearedRows.length === 0 && clearedCols.length === 0) {
    return {
      board,
      obstacles,
      clearedRows,
      clearedCols,
      monochromeBonusLines: 0,
    };
  }
  const next = cloneBoard(board);
  const obs = cloneObstacles(obstacles);
  const rowSet = new Set(clearedRows);
  const colSet = new Set(clearedCols);
  const size = boardSizeOf(board);

  let monoLines = 0;
  for (const r of clearedRows) {
    if (isLineMonochrome(board, [r], 'row')) monoLines += 1;
  }
  for (const c of clearedCols) {
    if (isLineMonochrome(board, [c], 'col')) monoLines += 1;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inRow = rowSet.has(y);
      const inCol = colSet.has(x);
      if (!inRow && !inCol) continue;
      const k = obstacleKey(x, y);
      if (obs[k] === 'block') continue;
      if (obs[k] === 'ice') {
        delete obs[k];
        continue;
      }
      next[y][x] = null;
    }
  }
  return {
    board: next,
    obstacles: obs,
    clearedRows,
    clearedCols,
    monochromeBonusLines: monoLines,
  };
}

export function findFirstFit(
  board: Board,
  piece: Piece,
  obstacles: ObstacleMap = {},
): { x: number; y: number } | null {
  const size = boardSizeOf(board);
  if (piece.kind === 'hammer' || piece.kind === 'bomb') {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (canPlace(board, piece, x, y, obstacles)) return { x, y };
    return null;
  }
  const maxX = size - piece.width;
  const maxY = size - piece.height;
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      if (canPlace(board, piece, x, y, obstacles)) return { x, y };
    }
  }
  return null;
}

export function isAnyPlaceable(
  board: Board,
  pool: Pool,
  obstacles: ObstacleMap = {},
): boolean {
  for (const slot of pool) {
    if (slot.consumed) continue;
    if (findFirstFit(board, slot.piece, obstacles)) return true;
  }
  return false;
}

export function previewClearedLines(
  board: Board,
  piece: Piece,
  x: number,
  y: number,
  obstacles: ObstacleMap = {},
): { rows: number[]; cols: number[] } {
  if (!canPlace(board, piece, x, y, obstacles)) return { rows: [], cols: [] };
  const placed = place(board, piece, x, y, obstacles);
  return {
    rows: fullRows(placed.board, placed.obstacles),
    cols: fullCols(placed.board, placed.obstacles),
  };
}

export function fillBoardRandom(
  rng: () => number,
  size: number,
  density: number,
): Board {
  const b = emptyBoard(size);
  const palette = ['--piece-red', '--piece-blue', '--piece-green', '--piece-orange'];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (rng() < density) {
        b[y][x] = palette[Math.floor(rng() * palette.length)];
      }
    }
  }
  return b;
}
