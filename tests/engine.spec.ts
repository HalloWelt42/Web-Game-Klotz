import { describe, it, expect } from 'vitest';
import {
  newGame,
  tryPlace,
  undo,
  canUndo,
  skip,
  canSkip,
  newFromReplay,
  tickTimer,
} from '../src/lib/game/engine';
import { pieceById } from '../src/lib/game/pieces';
import { emptyBoard } from '../src/lib/game/board';
import type { GameState, Pool, Replay } from '../src/lib/game/types';

function withBoard(state: GameState, board: GameState['board']): GameState {
  return { ...state, board };
}

function withPool(state: GameState, pool: Pool): GameState {
  return { ...state, pool };
}

describe('engine.newGame', () => {
  it('liefert ein laufendes Spiel mit drei Pool-Slots', () => {
    const s = newGame('endless', 42);
    expect(s.status).toBe('running');
    expect(s.pool).toHaveLength(3);
    expect(s.score).toBe(0);
    expect(s.combo).toBe(0);
  });

  it('ist deterministisch bei gleichem Seed', () => {
    const a = newGame('endless', 4711);
    const b = newGame('endless', 4711);
    expect(a.pool.map((s) => s.piece.id)).toEqual(b.pool.map((s) => s.piece.id));
  });
});

describe('engine.tryPlace', () => {
  it('platziert Stein und konsumiert Pool-Slot', () => {
    const u1 = pieceById('U1')!;
    const s = withPool(newGame('endless', 1), [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 5, 5);
    expect(out).not.toBeNull();
    expect(out!.state.pool[0].consumed).toBe(true);
    expect(out!.state.pool[1].consumed).toBe(false);
    expect(out!.state.score).toBe(1);
  });

  it('liefert null bei ungueltiger Position', () => {
    const u1 = pieceById('U1')!;
    const s = withPool(newGame('endless', 1), [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 99, 99);
    expect(out).toBeNull();
  });

  it('refillt Pool, wenn alle drei verbraucht sind', () => {
    const u1 = pieceById('U1')!;
    let s = withPool(newGame('endless', 1), [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    s = tryPlace(s, 0, 0, 0)!.state;
    s = tryPlace(s, 1, 2, 0)!.state;
    s = tryPlace(s, 2, 4, 0)!.state;
    expect(s.pool.every((p) => !p.consumed)).toBe(true);
  });

  it('erkennt Game Over wenn nach dem Zug kein Stein mehr passt', () => {
    const board = emptyBoard();
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) board[y][x] = '--piece-blue';
    }
    // Pro Reihe und Spalte zwei nicht benachbarte Luecken: U1 platzierbar,
    // aber drei zusammenhaengende Felder gibt es nirgends.
    for (let y = 0; y < 10; y++) {
      board[y][y] = null;
      board[y][(y + 5) % 10] = null;
    }

    const u1 = pieceById('U1')!;
    const i3 = pieceById('I3H')!;
    const state = withBoard(
      withPool(newGame('endless', 1), [
        { piece: u1, consumed: false },
        { piece: i3, consumed: false },
        { piece: i3, consumed: false },
      ]),
      board,
    );
    const out = tryPlace(state, 0, 0, 0);
    expect(out).not.toBeNull();
    expect(out!.state.status).toBe('gameover');
  });
});

describe('engine.undo', () => {
  it('kann nach einem Zug rueckgaengig machen', () => {
    const u1 = pieceById('U1')!;
    let s = withPool(newGame('endless', 1), [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const before = s;
    s = tryPlace(s, 0, 5, 5)!.state;
    expect(canUndo(s)).toBe(true);
    const reverted = undo(s);
    expect(reverted.score).toBe(before.score);
    expect(reverted.pool[0].consumed).toBe(false);
    expect(canUndo(reverted)).toBe(false);
  });
});

describe('engine.skip', () => {
  it('kann einen Stein skippen mit Punktabzug', () => {
    const u1 = pieceById('U1')!;
    let s = withPool(
      { ...newGame('endless', 1), score: 10 },
      [
        { piece: u1, consumed: false },
        { piece: u1, consumed: false },
        { piece: u1, consumed: false },
      ],
    );
    expect(canSkip(s, 0)).toBe(true);
    s = skip(s, 0);
    expect(s.skipUsed).toBe(true);
    expect(s.score).toBe(5);
    expect(canSkip(s, 0)).toBe(false);
  });
});

describe('engine.tickTimer', () => {
  it('beendet das Spiel bei abgelaufener Zeit', () => {
    let s: GameState = { ...newGame('timed', 1), timeLeft: 2 };
    s = tickTimer(s, 1);
    expect(s.status).toBe('running');
    s = tickTimer(s, 1);
    expect(s.status).toBe('gameover');
    expect(s.timeLeft).toBe(0);
  });
});

describe('engine.replay', () => {
  it('kann eine Partie aus Replay rekonstruieren', () => {
    let original = newGame('endless', 12345);
    const slot = original.pool[0];
    const out = tryPlace(original, 0, 5, 5);
    if (!out) throw new Error('placement should succeed');
    const replay: Replay = {
      seed: 12345,
      mode: 'endless',
      moves: [{ slot: 0, pieceId: slot.piece.id, x: 5, y: 5 }],
    };
    const rebuilt = newFromReplay(replay);
    expect(rebuilt.score).toBe(out.state.score);
    expect(rebuilt.movesCount).toBe(1);
  });
});
