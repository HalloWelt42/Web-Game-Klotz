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
  rollPool,
} from '../src/lib/game/engine';
import { mulberry32 } from '../src/lib/game/rng';
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
    // moves-Limit = 14 für Level 1, Goal = 80 Punkte
    state = withPool(state, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    state = { ...state, movesCount: 13 };
    // U1 gibt 1 Punkt -> nach Zug 14 ist movesCount=14 und score=1, Goal 80 nicht erreicht
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

  it('schrumpft erstmals nach 30 Zügen (Tick 1 -> Ring 1)', () => {
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 29,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    expect(countBlocks(s)).toBe(0);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(30);
    // Ring 1 in 10x10 -> 36 Block-Felder
    expect(countBlocks(out!.state)).toBe(36);
  });

  it('schrumpft nicht vor dem 30. Zug', () => {
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 28,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(29);
    expect(countBlocks(out!.state)).toBe(0);
  });

  it('Combo wird beim Schrumpf-Tick zurückgesetzt (Ring 1 -> 2 bei movesCount=55)', () => {
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      combo: 7,
      movesCount: 54,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(55);
    expect(out!.state.combo).toBe(0);
  });

  it('zwischen Schrumpf-Ticks bleibt der Block-Ring stabil', () => {
    const u1 = pieceById('U1')!;
    // movesCount=40 -> nach +1 wird movesCount=41, zwischen Tick 1 (30) und Tick 2 (55)
    let s: GameState = {
      ...newGame('shrink', 1),
      combo: 4,
      movesCount: 40,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(41);
    expect(countBlocks(out!.state)).toBe(36);
  });

  it('rollPool filtert nach Feldmaxima -- keine Steine groesser als nicht-Block-Bereich', () => {
    // Block-Ring auf 10x10 mit innerer 4x4-Fläche (x:3-6, y:3-6).
    // rollPool darf keine Pieces > 4 in einer Dimension zurückliefern,
    // unabhängig vom aktuellen Belegungszustand.
    const board = emptyBoard();
    const obstacles: Record<string, 'block' | 'ice'> = {};
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 3; j++) {
        obstacles[`${i},${j}`] = 'block';
        obstacles[`${i},${9 - j}`] = 'block';
        obstacles[`${j},${i}`] = 'block';
        obstacles[`${9 - j},${i}`] = 'block';
      }
    }
    // Auch wenn die innere Fläche teilweise belegt ist, soll der Filter
    // nur die Größe checken, nicht die aktuelle Platzierbarkeit:
    board[3][3] = '--piece-blue';
    board[3][4] = '--piece-blue';
    board[4][3] = '--piece-blue';

    for (let attempt = 0; attempt < 100; attempt++) {
      const rng = mulberry32(attempt + 1);
      const pool = rollPool(rng, 'shrink', board, obstacles);
      for (const slot of pool) {
        expect(slot.piece.width).toBeLessThanOrEqual(4);
        expect(slot.piece.height).toBeLessThanOrEqual(4);
      }
    }
  });

  it('Pool wird nach Schrumpf-Tick revalidiert -- kein Patt durch zu große Steine', () => {
    // Tick 3 (Ring 3) tritt bei movesCount 75 ein. Innenfläche danach = 4x4.
    const i5h = pieceById('I5H')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 74,
    };
    s = withPool(s, [
      { piece: pieceById('U1')!, consumed: false },
      { piece: i5h, consumed: true },
      { piece: i5h, consumed: true },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    const placeable = out!.state.pool.some((slot) => {
      if (slot.consumed) return false;
      return slot.piece.width <= 4 && slot.piece.height <= 4;
    });
    expect(placeable).toBe(true);
  });

  it('Game Over sobald Innenfläche 2x2 erreicht (Ring 4 bei movesCount=90)', () => {
    // ringCap = (10-2)/2 = 4. Schwellen: 30, 55, 75, 90.
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 89,
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out = tryPlace(s, 0, 4, 4);
    expect(out).not.toBeNull();
    expect(out!.state.movesCount).toBe(90);
    expect(out!.state.status).toBe('gameover');
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

describe('engine.eis (Ice-Felder)', () => {
  it('eine Reihe mit Eis und sonst vollen Steinen wird geräumt, das Eis taut', () => {
    // Reihe 5 hat ein Eisfeld bei x=3, alle anderen 9 Zellen sind belegt
    const board = emptyBoard();
    const obstacles: Record<string, 'block' | 'ice'> = {};
    obstacles['3,5'] = 'ice';
    for (let x = 0; x < 10; x++) {
      if (x === 3) continue; // hier ist das Eis
      board[5][x] = '--piece-blue';
    }
    // Lücke bei (0,9): wir setzen einen U1, was die letzte freie Zelle
    // belegen würde -- aber es gibt ja schon keine, also nehmen wir Reihe 9
    // mit einer Lücke
    for (let x = 0; x < 9; x++) board[9][x] = '--piece-green';

    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('level', 1, 'level-3'),
    };
    s = withBoard(withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]), board);
    s = { ...s, obstacles };

    // U1 in die letzte freie Zelle von Reihe 9 setzen -- räumt Reihe 9.
    // Reihe 5 ist auch voll (alle Stein-Zellen belegt, Eis als Lücke ignoriert)
    // und müsste damit auch geräumt werden.
    const out = tryPlace(s, 0, 9, 9);
    expect(out).not.toBeNull();
    // Reihe 5 sollte als geräumt erkannt werden -> rowsCleared >= 2
    expect(out!.state.rowsCleared).toBeGreaterThanOrEqual(2);
    // Eis bei (3,5) muss getaut sein -- nicht mehr in obstacles
    expect(out!.state.obstacles['3,5']).toBeUndefined();
  });
});

describe('engine.phantom-linien (Block-Ring)', () => {
  it('eine reine Block-Reihe gilt NICHT als geräumte Linie', () => {
    // Simuliere Shrink-State mit Block-Ring: y=0, y=9, x=0, x=9 sind Block.
    // Bei jedem Zug dürfen diese Reihen/Spalten nicht als clearedRows/Cols
    // erscheinen -- sonst werden grundlose Combos und Specials erzeugt.
    const u1 = pieceById('U1')!;
    let s: GameState = {
      ...newGame('shrink', 1),
      movesCount: 29, // beim nächsten Zug -> 30 = Tick 1
    };
    s = withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    // Erster Zug erzeugt Ring 1
    const out1 = tryPlace(s, 0, 4, 4);
    expect(out1).not.toBeNull();
    expect(out1!.state.combo).toBe(0);
    expect(out1!.state.rowsCleared).toBe(0);
    expect(out1!.state.colsCleared).toBe(0);

    // Zweiter Zug nach dem Ring -- darf KEINE Phantom-Räumung erzeugen
    let s2 = out1!.state;
    s2 = withPool(s2, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]);
    const out2 = tryPlace(s2, 0, 5, 5);
    expect(out2).not.toBeNull();
    // Combo bleibt 0, weil kein echter Räumungs-Zug
    expect(out2!.state.combo).toBe(0);
    // rowsCleared / colsCleared bleiben unverändert
    expect(out2!.state.rowsCleared).toBe(0);
    expect(out2!.state.colsCleared).toBe(0);
    // Specials wurden NICHT vergeben
    expect(out2!.state.specials.bomb).toBe(0);
    expect(out2!.state.specials.hammer).toBe(0);
    expect(out2!.state.specials.joker).toBe(0);
  });
});

describe('engine.specials-vergabe', () => {
  it('Combo x2 vergibt KEINE Bombe (Schwelle ist x3)', () => {
    // Konstruiere einen State mit combo=1 und einer Reihe, die durch
    // den Zug voll wird -> newCombo=2 -> sollte KEIN Special geben
    const u1 = pieceById('U1')!;
    const board = emptyBoard();
    // Reihe 9 bis auf eine Zelle voll
    for (let x = 0; x < 9; x++) board[9][x] = '--piece-blue';
    let s: GameState = {
      ...newGame('endless', 1),
      combo: 1,
    };
    s = withBoard(withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]), board);
    const specialsBefore = { ...s.specials };
    const out = tryPlace(s, 0, 9, 9);
    expect(out).not.toBeNull();
    expect(out!.state.combo).toBe(2);
    // Combo x2 vergibt nichts mehr
    expect(out!.state.specials).toEqual(specialsBefore);
  });

  it('Combo x3 vergibt eine Bombe', () => {
    const u1 = pieceById('U1')!;
    const board = emptyBoard();
    for (let x = 0; x < 9; x++) board[9][x] = '--piece-blue';
    let s: GameState = {
      ...newGame('endless', 1),
      combo: 2,
    };
    s = withBoard(withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]), board);
    const out = tryPlace(s, 0, 9, 9);
    expect(out).not.toBeNull();
    expect(out!.state.combo).toBe(3);
    expect(out!.state.specials.bomb).toBe(1);
    expect(out!.state.specials.hammer).toBe(0);
  });

  it('Special-Cap: keine Bombe mehr ab 3 Bomben im Inventar', () => {
    const u1 = pieceById('U1')!;
    const board = emptyBoard();
    for (let x = 0; x < 9; x++) board[9][x] = '--piece-blue';
    let s: GameState = {
      ...newGame('endless', 1),
      combo: 2,
      specials: { bomb: 3, hammer: 0, joker: 0 },
    };
    s = withBoard(withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]), board);
    const out = tryPlace(s, 0, 9, 9);
    expect(out).not.toBeNull();
    expect(out!.state.combo).toBe(3);
    // Combo x3 hätte Bombe gegeben -- aber Cap greift
    expect(out!.state.specials.bomb).toBe(3);
  });

  it('Linien-Milestone skaliert mit Brettgröße: 10x10 erste Bombe nach ~60 Zellen', () => {
    // 6 geräumte Linien * 10 = 60 Zellen -> 1 Bombe
    const u1 = pieceById('U1')!;
    const board = emptyBoard();
    for (let x = 0; x < 9; x++) board[9][x] = '--piece-blue';
    let s: GameState = {
      ...newGame('endless', 1),
      rowsCleared: 5, // wir haben schon 5 Linien geräumt (50 Zellen)
      colsCleared: 0,
    };
    s = withBoard(withPool(s, [
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
      { piece: u1, consumed: false },
    ]), board);
    const out = tryPlace(s, 0, 9, 9);
    expect(out).not.toBeNull();
    // Nach 6 Linien ergibt 60 Zellen, das überschreitet die 60-Schwelle
    expect(out!.state.specials.bomb).toBe(1);
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
