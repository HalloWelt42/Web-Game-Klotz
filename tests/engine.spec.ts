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

  it('liefert null bei ungültiger Position', () => {
    const u1 = pieceById('U1')!;
    const s = withPool(newGame('endless', 1), [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 99, 99);
    expect(out).toBeNull();
  });

  it('füllt den Pool nach, wenn alle drei verbraucht sind', () => {
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
    // Pro Reihe und Spalte zwei nicht benachbarte Lücken: U1 platzierbar,
    // aber drei zusammenhängende Felder gibt es nirgends.
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

  it('bleibt running wenn Pool blockiert ist aber Specials im Inventar sind', () => {
    const board = emptyBoard();
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) board[y][x] = '--piece-blue';
    }
    for (let y = 0; y < 10; y++) {
      board[y][y] = null;
      board[y][(y + 5) % 10] = null;
    }

    const u1 = pieceById('U1')!;
    const i3 = pieceById('I3H')!;
    const baseState = withBoard(
      withPool(newGame('endless', 1), [
        { piece: u1, consumed: false },
        { piece: i3, consumed: false },
        { piece: i3, consumed: false },
      ]),
      board,
    );
    // Spieler hätte eine Bombe als Rettungsanker
    const stateWithBomb: GameState = {
      ...baseState,
      specials: { bomb: 1, hammer: 0, joker: 0 },
    };
    const out = tryPlace(stateWithBomb, 0, 0, 0);
    expect(out).not.toBeNull();
    expect(out!.state.status).toBe('running');
  });
});

describe('engine.undo', () => {
  it('kann nach einem Zug rückgängig machen', () => {
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

describe('engine end states', () => {
  it('Won: Reverse-Modus sobald 8 Linien geräumt sind', () => {
    let state = newGame('reverse', 99);
    // simuliere 8 cleared lines via direkten Patch
    state = { ...state, rowsCleared: 8, colsCleared: 0 };
    // Trigger durch tryPlace eines beliebigen U1 auf einem freien Feld
    // wir setzen dafür ein leeres Brett mit dem U1-Slot
    const u1 = pieceById('U1')!;
    state = withBoard(
      withPool(state, [
        { piece: u1, consumed: false },
        { piece: u1, consumed: false },
        { piece: u1, consumed: false },
      ]),
      emptyBoard(),
    );
    // Jetzt ist clearance = 8 und won-condition (clears: 8) trifft
    const out = tryPlace(state, 0, 5, 5);
    expect(out).not.toBeNull();
    expect(out!.state.status).toBe('won');
  });

  it('Lost: Levels mit moves-Limit erschöpft, Goal nicht erreicht', () => {
    const u1 = pieceById('U1')!;
    let state = newGame('level', 1, 'level-1');
    // moves-Limit = 12 für Level 1, Goal = 80 Punkte
    state = withPool(state, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    state = { ...state, movesCount: 11 };
    // U1 gibt 1 Punkt -> nach Zug 12 ist movesCount=12 und score=1, Goal 80 nicht erreicht
    const out = tryPlace(state, 0, 5, 5);
    expect(out).not.toBeNull();
    expect(out!.state.status).toBe('gameover');
  });

  it('Won: Levels wenn Punkte-Ziel erreicht', () => {
    const u1 = pieceById('U1')!;
    let state = newGame('level', 1, 'level-1');
    state = withPool(state, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    // Stelle Score knapp unter Goal (80) -- ein U1 (1 Punkt) reicht nicht.
    // Nutze daher ein größeres Setup: gib 79 Punkte vor.
    state = { ...state, score: 79 };
    const out = tryPlace(state, 0, 5, 5);
    expect(out).not.toBeNull();
    // 79 + 1 = 80 trifft Goal genau
    expect(out!.state.score).toBe(80);
    expect(out!.state.status).toBe('won');
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
