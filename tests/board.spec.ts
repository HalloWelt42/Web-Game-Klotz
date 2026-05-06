import { describe, it, expect } from 'vitest';
import {
  canPlace,
  clearLines,
  emptyBoard,
  fullCols,
  fullRows,
  isAnyPlaceable,
  place,
  previewClearedLines,
} from '../src/lib/game/board';
import { pieceById, PIECES } from '../src/lib/game/pieces';
import type { Pool } from '../src/lib/game/types';

function placeBoard(board: ReturnType<typeof emptyBoard>, id: string, x: number, y: number) {
  return place(board, pieceById(id)!, x, y).board;
}

describe('emptyBoard', () => {
  it('liefert ein 10x10-Brett mit lauter null', () => {
    const b = emptyBoard();
    expect(b).toHaveLength(10);
    for (const row of b) {
      expect(row).toHaveLength(10);
      for (const cell of row) expect(cell).toBeNull();
    }
  });
});

describe('canPlace', () => {
  const piece = pieceById('I3H')!;

  it('erlaubt Platzieren auf leerem Brett', () => {
    expect(canPlace(emptyBoard(), piece, 0, 0)).toBe(true);
    expect(canPlace(emptyBoard(), piece, 7, 9)).toBe(true);
  });

  it('lehnt Platzierung ueber Rand ab', () => {
    expect(canPlace(emptyBoard(), piece, 8, 0)).toBe(false);
    expect(canPlace(emptyBoard(), piece, -1, 0)).toBe(false);
    expect(canPlace(emptyBoard(), piece, 0, 10)).toBe(false);
  });

  it('lehnt Kollision mit belegter Zelle ab', () => {
    const b = placeBoard(emptyBoard(), 'U1', 1, 0);
    expect(canPlace(b, piece, 0, 0)).toBe(false);
    expect(canPlace(b, piece, 0, 1)).toBe(true);
  });

  it('respektiert Block-Hindernis', () => {
    const obstacles = { '5,5': 'block' as const };
    expect(canPlace(emptyBoard(), pieceById('U1')!, 5, 5, obstacles)).toBe(false);
  });
});

describe('place', () => {
  it('liefert ein neues Board (immutable)', () => {
    const b1 = emptyBoard();
    const result = place(b1, pieceById('U1')!, 0, 0);
    expect(b1[0][0]).toBeNull();
    expect(result.board[0][0]).not.toBeNull();
  });

  it('schreibt den Color-Token in alle Zellen', () => {
    const piece = pieceById('I2H')!;
    const result = place(emptyBoard(), piece, 0, 0);
    expect(result.board[0][0]).toBe(piece.colorToken);
    expect(result.board[0][1]).toBe(piece.colorToken);
  });

  it('Bombe leert 3x3 um den Mittelpunkt', () => {
    let board = emptyBoard();
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) board[y][x] = '--piece-blue';
    const result = place(board, pieceById('SP_BOMB')!, 5, 5);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) expect(result.board[5 + dy][5 + dx]).toBeNull();
    expect(result.board[5][2]).toBe('--piece-blue');
  });

  it('Hammer leert genau eine Zelle', () => {
    let board = emptyBoard();
    board[3][3] = '--piece-red';
    board[3][4] = '--piece-red';
    const result = place(board, pieceById('SP_HAMMER')!, 3, 3);
    expect(result.board[3][3]).toBeNull();
    expect(result.board[3][4]).toBe('--piece-red');
  });
});

describe('fullRows / fullCols / clearLines', () => {
  it('erkennt volle Reihen und raeumt sie', () => {
    let b = emptyBoard();
    b = placeBoard(b, 'I5H', 0, 0);
    b = placeBoard(b, 'I5H', 5, 0);
    expect(fullRows(b)).toEqual([0]);
    expect(fullCols(b)).toEqual([]);
    const result = clearLines(b);
    expect(result.clearedRows).toEqual([0]);
    expect(result.clearedCols).toEqual([]);
    for (let x = 0; x < 10; x++) expect(result.board[0][x]).toBeNull();
  });

  it('raeumt Reihen und Spalten gleichzeitig, Schnittpunkt nur einmal', () => {
    let b = emptyBoard();
    b = placeBoard(b, 'I5H', 0, 0);
    b = placeBoard(b, 'I5H', 5, 0);
    b = placeBoard(b, 'I5V', 0, 1);
    b = placeBoard(b, 'I5V', 0, 5);
    const result = clearLines(b);
    expect(result.clearedRows).toEqual([0]);
    expect(result.clearedCols).toEqual([0]);
    for (let x = 0; x < 10; x++) expect(result.board[0][x]).toBeNull();
    for (let y = 0; y < 10; y++) expect(result.board[y][0]).toBeNull();
  });

  it('zaehlt einfarbige Reihen als Mono-Bonus', () => {
    let b = emptyBoard();
    b = placeBoard(b, 'I5H', 0, 0);
    b = placeBoard(b, 'I5H', 5, 0);
    const result = clearLines(b);
    expect(result.monochromeBonusLines).toBe(1);
  });

  it('macht nichts ohne volle Linie', () => {
    const b = placeBoard(emptyBoard(), 'U1', 5, 5);
    const r = clearLines(b);
    expect(r.clearedRows).toHaveLength(0);
    expect(r.clearedCols).toHaveLength(0);
    expect(r.board).toBe(b);
  });
});

describe('previewClearedLines', () => {
  it('zeigt voraus, dass das Legen die Reihe komplettiert', () => {
    let b = emptyBoard();
    b = placeBoard(b, 'I5H', 0, 0);
    const i5 = pieceById('I5H')!;
    const preview = previewClearedLines(b, i5, 5, 0);
    expect(preview.rows).toEqual([0]);
  });

  it('liefert leere Listen bei ungueltiger Position', () => {
    const preview = previewClearedLines(emptyBoard(), pieceById('I5H')!, 8, 0);
    expect(preview.rows).toHaveLength(0);
    expect(preview.cols).toHaveLength(0);
  });
});

describe('isAnyPlaceable', () => {
  it('ist false, wenn kein offener Stein passt', () => {
    let b = emptyBoard();
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 10; x++) b[y][x] = '--piece-blue';
    const u1 = pieceById('U1')!;
    const pool: Pool = [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ];
    expect(isAnyPlaceable(b, pool)).toBe(false);
  });

  it('ignoriert verbrauchte Slots', () => {
    const u1 = pieceById('U1')!;
    const pool: Pool = [
      { piece: u1, consumed: true },
      { piece: u1, consumed: true },
      { piece: u1, consumed: false },
    ];
    expect(isAnyPlaceable(emptyBoard(), pool)).toBe(true);
  });
});

describe('PIECES Katalog', () => {
  it('alle Steine haben mindestens eine Zelle und konsistente width/height', () => {
    for (const p of PIECES) {
      expect(p.cells.length).toBeGreaterThan(0);
      const maxX = Math.max(...p.cells.map(([x]) => x));
      const maxY = Math.max(...p.cells.map(([, y]) => y));
      expect(p.width).toBe(maxX + 1);
      expect(p.height).toBe(maxY + 1);
    }
  });
});
