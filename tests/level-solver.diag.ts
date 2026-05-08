import { describe, it } from 'vitest';
import { newGame, tryPlace } from '../src/lib/game/engine';
import { LEVELS } from '../src/lib/game/levels';
import { canPlace } from '../src/lib/game/board';
import type { GameState } from '../src/lib/game/types';

// Greedy-Solver: testet pro Zug alle moeglichen Platzierungen aller
// Pool-Steine, bewertet das Ergebnis und nimmt den besten Zug.
// Heuristik:
//   - Punkte gewinnen (am wichtigsten)
//   - Linien raeumen (gibt Folge-Combos und Bonus)
//   - Brett moeglichst leer halten

type Move = { slot: 0 | 1 | 2; x: number; y: number };

function evaluateState(state: GameState): number {
  const size = state.boardSize;
  let filled = 0;
  let nearFullBonus = 0;

  // Reihen-Analyse
  for (let r = 0; r < size; r++) {
    let rowFilled = 0;
    let rowPlayable = 0;
    for (let c = 0; c < size; c++) {
      const k = `${c},${r}`;
      if (state.obstacles[k] === 'block') continue;
      rowPlayable++;
      if (state.board[r][c]) {
        rowFilled++;
        filled++;
      }
    }
    // Reihen, die fast voll sind, sind potentielle Räumungen
    if (rowPlayable > 0 && rowFilled >= rowPlayable - 2 && rowFilled < rowPlayable) {
      nearFullBonus += (rowFilled - (rowPlayable - 3)) * 8;
    }
  }
  // Spalten-Analyse
  for (let c = 0; c < size; c++) {
    let colFilled = 0;
    let colPlayable = 0;
    for (let r = 0; r < size; r++) {
      const k = `${c},${r}`;
      if (state.obstacles[k] === 'block') continue;
      colPlayable++;
      if (state.board[r][c]) colFilled++;
    }
    if (colPlayable > 0 && colFilled >= colPlayable - 2 && colFilled < colPlayable) {
      nearFullBonus += (colFilled - (colPlayable - 3)) * 8;
    }
  }

  return -filled * 0.5 + nearFullBonus + state.combo * 5;
}

function evaluateMove(state: GameState, move: Move): number | null {
  const out = tryPlace(state, move.slot, move.x, move.y);
  if (!out) return null;
  const lines = out.cleared.rows.length + out.cleared.cols.length;
  let score = out.pointsGained * 1.5;
  score += lines * 60;
  score += evaluateState(out.state);
  return score;
}

function bestMove(state: GameState): Move | null {
  let best: Move | null = null;
  let bestScore = -Infinity;
  const size = state.boardSize;

  for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
    const slot = state.pool[slotIdx];
    if (slot.consumed) continue;
    const piece = slot.piece;

    for (let y = 0; y <= size - piece.height; y++) {
      for (let x = 0; x <= size - piece.width; x++) {
        if (!canPlace(state.board, piece, x, y, state.obstacles)) continue;
        const move: Move = { slot: slotIdx as 0 | 1 | 2, x, y };
        const score = evaluateMove(state, move);
        if (score === null) continue;
        if (score > bestScore) {
          bestScore = score;
          best = move;
        }
      }
    }
  }

  return best;
}

function solveLevel(levelId: string, seed: number): { won: boolean; status: string; score: number; movesUsed: number; goalProgress: number } {
  let state = newGame('level', seed, levelId);
  while (state.status === 'running') {
    const move = bestMove(state);
    if (!move) break;
    const out = tryPlace(state, move.slot, move.x, move.y);
    if (!out) break;
    state = out.state;
  }

  // Goal-Fortschritt: wie nah war der Spieler am Ziel?
  let progress = 0;
  if (state.goal) {
    if (state.goal.points) progress = state.score / state.goal.points;
    else if (state.goal.clears)
      progress = (state.rowsCleared + state.colsCleared) / state.goal.clears;
    else if (state.goal.rows) progress = state.rowsCleared / state.goal.rows;
    else if (state.goal.cols) progress = state.colsCleared / state.goal.cols;
  }
  return {
    won: state.status === 'won',
    status: state.status,
    score: state.score,
    movesUsed: state.movesCount,
    goalProgress: progress,
  };
}

// Diagnose-Suite -- nicht im normalen Test-Run, weil zu lang (~25s).
// Aufruf: pnpm test:solver
describe('level-solvability (greedy AI ueber Zufallsseeds)', () => {
  // 100 Seeds reichen fuer Tendenz, halten den Lauf < 15s gesamt.
  const SEEDS = 100;
  it.each(LEVELS.map((l) => [l.id, l]))(
    'Level %s -- Erfolgsrate ueber %d Seeds',
    (_id, level) => {
      let won = 0;
      let totalScore = 0;
      let totalProgress = 0;
      const losses: Array<{ seed: number; progress: number; score: number }> = [];

      for (let seed = 1; seed <= SEEDS; seed++) {
        const r = solveLevel(level.id, seed);
        if (r.won) won++;
        else losses.push({ seed, progress: r.goalProgress, score: r.score });
        totalScore += r.score;
        totalProgress += r.goalProgress;
      }

      const winRate = (won / SEEDS) * 100;
      const avgProgress = (totalProgress / SEEDS) * 100;
      const avgScore = totalScore / SEEDS;

      // eslint-disable-next-line no-console
      console.log(
        `[${level.id}] ${level.title.padEnd(20)} -- Win ${winRate.toFixed(1)}%  AvgScore ${avgScore.toFixed(0)}  AvgProgress ${avgProgress.toFixed(1)}%  Goal: ${JSON.stringify(level.goal)} in ${level.movesLimit} Zuegen`,
      );
    },
  );
});
