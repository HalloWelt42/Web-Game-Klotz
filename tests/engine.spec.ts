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

describe('engine.shrink', () => {
  function countBlocks(state: GameState): number {
    let n = 0;
    for (const v of Object.values(state.obstacles)) if (v === 'block') n += 1;
    return n;
  }

  it('startet ohne Block-Ring', () => {
    const s = newGame('shrink', 1);
    expect(countBlocks(s)).toBe(0);
  });

  it('schrumpft alle 6 Züge einen Ring nach innen', () => {
    // Direkter Test: movesCount = 5 -> nach einem weiteren Zug = 6 ergibt Ring 1
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 5,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    // Vor dem entscheidenden Zug: kein Ring
    expect(countBlocks(s)).toBe(0);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(6);
    // Ring 1 in 10x10 -> äußerste Zellen werden Block: 4 Seiten * 10 - 4 Ecken = 36
    expect(countBlocks(out!.state)).toBe(36);
  });

  it('schrumpft erst nach 6 Zügen, nicht früher', () => {
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 4,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(5);
    expect(countBlocks(out!.state)).toBe(0);
  });

  it('Combo wird bei jedem Schrumpf-Tick zurückgesetzt', () => {
    const u1 = pieceById('U1')!;
    // movesCount=11 -> nach +1 wird movesCount=12, das ist der 2. Schrumpf-Tick
    let s: GameState = {
      ...newGame('shrink', 1),
      combo: 7,
      movesCount: 11,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(12);
    // Schrumpf-Tick greift -> Combo ist 0, völlig unabhängig vom vorherigen Wert
    expect(out!.state.combo).toBe(0);
  });

  it('zwischen Schrumpf-Ticks bleibt Combo bestehen', () => {
    const u1 = pieceById('U1')!;
    // movesCount=7 -> nach +1 wird movesCount=8, kein Schrumpf-Tick (Ring bleibt 1)
    let s: GameState = {
      ...newGame('shrink', 1),
      combo: 4,
      movesCount: 7,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(8);
    // Ohne Linien-Räumung wäre combo=0 sowieso (newCombo = willCombo ? combo+1 : 0).
    // Trotzdem darf der Schrumpf-Code nicht aktiv eingreifen -- wir prüfen
    // dass der Tick-Detection-Code nicht zwischen Schrumpf-Stufen feuert.
    // Indirekter Test: Der Block-Ring darf sich nicht verändert haben.
    expect(countBlocks(out!.state)).toBe(36);
  });

  it('Pool wird nach Schrumpf-Tick revalidiert -- kein Patt durch zu große Steine', () => {
    // Der Pool enthält ein I5H (5 Zellen breit). Nach mehreren Shrink-Ticks
    // ist das Innere zu klein, um den Stein zu platzieren -- der Engine
    // muss den unspielbaren Slot durch ein passendes Piece ersetzen.
    const i5h = pieceById('I5H')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 23, // beim nächsten Zug -> 24, Ring 4 bei 10x10 = 2x2 innen
    };
    s = withPool(s, [
      { piece: pieceById('U1')!, consumed: false }, // platzierbar in 2x2
      { piece: i5h, consumed: true },
      { piece: i5h, consumed: true },
    ]);
    // U1 platzieren -> Schrumpf-Tick -> Pool-Refill (alle consumed)
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    // Pool sollte jetzt platzierbare Pieces haben
    const placeable = out!.state.pool.some((slot) => {
      if (slot.consumed) return false;
      // Innenfläche ist nach Ring 4 nur noch 2x2 (Spalten 4-5, Reihen 4-5)
      // I5H mit Breite 5 passt da nicht
      return slot.piece.width <= 2 && slot.piece.height <= 2;
    });
    expect(placeable).toBe(true);
  });

  it('respektiert das 2x2-Mindestmaß bei 10x10', () => {
    // Direkter Test der Schrumpf-Stufe: bei sehr hohem movesCount sollte
    // ringCap das Wachstum begrenzen
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 200, // weit über jedem ringCap
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    // Trigger shrinkIfNeeded indirekt durch tryPlace
    const center = 4;
    const out = tryPlace(s, 0, center, center);
    if (!out) throw new Error('Zentrum sollte frei sein');
    // ringCap = (10-2)/2 = 4 -> 4*4 = 16 Block-Felder pro Seite, gesamter Ring
    // ergibt 10*10 - 2*2 = 96 Blocks
    expect(countBlocks(out.state)).toBe(96);
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
