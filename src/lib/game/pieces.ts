import type { Coord, Piece, PieceKind, PieceRarity } from './types';

function definePiece(
  id: string,
  cells: Coord[],
  colorToken: string,
  rarity: PieceRarity = 'common',
  kind: PieceKind = 'standard',
): Piece {
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of cells) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    id,
    cells,
    width: maxX + 1,
    height: maxY + 1,
    colorToken,
    kind,
    rarity,
  };
}

export const C = {
  red: '--piece-red',
  orange: '--piece-orange',
  yellow: '--piece-yellow',
  green: '--piece-green',
  teal: '--piece-teal',
  blue: '--piece-blue',
  purple: '--piece-purple',
  pink: '--piece-pink',
  special: '--piece-special',
};

export const STANDARD_PIECES: Piece[] = [
  // Klassische 1010!-Steine -- common
  definePiece('U1', [[0, 0]], C.pink),

  definePiece('I2H', [
    [0, 0],
    [1, 0],
  ], C.teal),
  definePiece('I2V', [
    [0, 0],
    [0, 1],
  ], C.teal),

  definePiece('I3H', [
    [0, 0],
    [1, 0],
    [2, 0],
  ], C.blue),
  definePiece('I3V', [
    [0, 0],
    [0, 1],
    [0, 2],
  ], C.blue),

  definePiece('I4H', [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ], C.purple),
  definePiece('I4V', [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ], C.purple),

  definePiece('I5H', [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
  ], C.red, 'uncommon'),
  definePiece('I5V', [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ], C.red, 'uncommon'),

  definePiece('O2', [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ], C.yellow),
  definePiece('O3', [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ], C.orange, 'uncommon'),

  definePiece('L_NE', [
    [0, 0],
    [0, 1],
    [1, 1],
  ], C.green),
  definePiece('L_NW', [
    [1, 0],
    [0, 1],
    [1, 1],
  ], C.green),
  definePiece('L_SE', [
    [0, 0],
    [1, 0],
    [0, 1],
  ], C.green),
  definePiece('L_SW', [
    [0, 0],
    [1, 0],
    [1, 1],
  ], C.green),

  definePiece('L3_NE', [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ], C.orange, 'uncommon'),
  definePiece('L3_NW', [
    [2, 0],
    [2, 1],
    [2, 2],
    [1, 2],
    [0, 2],
  ], C.orange, 'uncommon'),
  definePiece('L3_SE', [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
  ], C.orange, 'uncommon'),
  definePiece('L3_SW', [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
  ], C.orange, 'uncommon'),

  // Tetromino-Klassiker -- common
  definePiece('T_DOWN', [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ], C.purple),
  definePiece('T_UP', [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ], C.purple),
  definePiece('T_LEFT', [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ], C.purple),
  definePiece('T_RIGHT', [
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 2],
  ], C.purple),

  definePiece('S_H', [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ], C.green),
  definePiece('S_V', [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ], C.green),
  definePiece('Z_H', [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ], C.red),
  definePiece('Z_V', [
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2],
  ], C.red),

  // Pentominos -- uncommon
  definePiece('PLUS', [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ], C.pink, 'uncommon'),

  definePiece('Y_H', [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [1, 1],
  ], C.teal, 'uncommon'),
  definePiece('Y_V', [
    [0, 0],
    [0, 1],
    [1, 1],
    [0, 2],
    [0, 3],
  ], C.teal, 'uncommon'),

  // Seltene Pentominos -- rare
  definePiece('W', [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ], C.blue, 'rare'),

  definePiece('Z3_H', [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 1],
    [4, 1],
  ], C.red, 'rare'),

  definePiece('DIAMOND', [
    [1, 0],
    [0, 1],
    [2, 1],
    [1, 2],
  ], C.yellow, 'rare'),

  // Seltene Hexominos -- rare
  definePiece('HEX_LINE', [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ], C.purple, 'rare'),

  definePiece('STAIR_3', [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 2],
  ], C.orange, 'rare'),

  definePiece('BIG_L', [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 3],
    [2, 3],
  ], C.pink, 'rare'),

  definePiece('U_SHAPE', [
    [0, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ], C.blue, 'rare'),
];

export const SPECIAL_PIECES: Piece[] = [
  definePiece('SP_BOMB', [[0, 0]], C.special, 'common', 'bomb'),
  definePiece('SP_HAMMER', [[0, 0]], C.special, 'common', 'hammer'),
  definePiece('SP_JOKER', [[0, 0]], C.special, 'common', 'joker'),
];

export const PIECES: Piece[] = STANDARD_PIECES;
export const ALL_PIECES: Piece[] = [...STANDARD_PIECES, ...SPECIAL_PIECES];

export function pieceById(id: string): Piece | undefined {
  return ALL_PIECES.find((p) => p.id === id);
}

export const RARITY_WEIGHT: Record<PieceRarity, number> = {
  common: 10,
  uncommon: 4,
  rare: 1,
};

export function rotateCells(cells: Coord[], times: number): Coord[] {
  const r = ((times % 4) + 4) % 4;
  if (r === 0) return cells.map(([x, y]) => [x, y] as Coord);
  let next: Coord[] = cells.map(([x, y]) => [x, y] as Coord);
  for (let i = 0; i < r; i++) {
    next = next.map(([x, y]) => [y, -x] as Coord);
    let minX = Infinity;
    let minY = Infinity;
    for (const [x, y] of next) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    }
    next = next.map(([x, y]) => [x - minX, y - minY] as Coord);
  }
  return next;
}

export function rotatePiece(piece: Piece, times: number): Piece {
  if (piece.kind !== 'standard' || times % 4 === 0) return piece;
  const cells = rotateCells(piece.cells, times);
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of cells) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    ...piece,
    cells,
    width: maxX + 1,
    height: maxY + 1,
  };
}
