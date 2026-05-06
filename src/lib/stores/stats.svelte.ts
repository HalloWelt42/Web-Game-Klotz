import { evaluateAchievements } from '../game/achievements';
import { emptyStats, loadStats, saveStats } from '../game/persistence';
import type { GameState, LifetimeStats } from '../game/types';
import { DEFAULT_BOARD_SIZE } from '../game/types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyStreakFromScores(scores: { date: string }[]): number {
  if (scores.length === 0) return 0;
  const set = new Set(scores.map((s) => s.date));
  let streak = 0;
  const day = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = day.toISOString().slice(0, 10);
    if (set.has(iso)) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    } else {
      // Heute zaehlt nicht zwingend mit, also Toleranz von einem Tag
      if (i === 0) {
        day.setDate(day.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

function createStatsStore() {
  let value = $state<LifetimeStats>(emptyStats());
  let loaded = $state(false);
  let lastUnlocked = $state<string[]>([]);

  async function init() {
    value = await loadStats();
    loaded = true;
  }

  function unlockNew(state: GameState, when: 'placement' | 'gameover'): string[] {
    const newly = evaluateAchievements(
      { state, stats: $state.snapshot(value) as LifetimeStats, triggeredAt: when },
      value.achievements,
    );
    if (newly.length > 0) {
      value.achievements = [...value.achievements, ...newly];
      lastUnlocked = newly;
    }
    return newly;
  }

  async function recordPlacement(state: GameState, clearedRows: number, clearedCols: number) {
    value.rowsCleared += clearedRows;
    value.colsCleared += clearedCols;
    if (state.combo > value.highestCombo) value.highestCombo = state.combo;
    if (state.streak > value.longestStreak) value.longestStreak = state.streak;

    const size = state.boardSize;
    if (size === DEFAULT_BOARD_SIZE) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (state.board[y][x] !== null) value.heatmap[y][x] += 1;
        }
      }
    }
    unlockNew(state, 'placement');
    await saveStats($state.snapshot(value) as LifetimeStats);
  }

  async function recordGameOver(state: GameState) {
    value.gamesPlayed += 1;
    value.totalPoints += state.score;
    if (state.score > (value.perGameHigh[state.mode] ?? 0)) {
      value.perGameHigh[state.mode] = state.score;
    }
    if (state.mode === 'daily') {
      const today = todayIso();
      const without = value.dailyScores.filter((d) => d.date !== today);
      value.dailyScores = [{ date: today, score: state.score }, ...without].slice(0, 60);
    }
    if (state.mode === 'level' && state.levelId && state.status === 'won') {
      if (!value.completedLevels.includes(state.levelId)) {
        value.completedLevels = [...value.completedLevels, state.levelId];
      }
      const movesLimit = state.goal?.moves ?? state.movesCount;
      const ratio = movesLimit > 0 ? state.movesCount / movesLimit : 1;
      let stars = 1;
      if (ratio <= 0.6) stars = 3;
      else if (ratio <= 0.8) stars = 2;
      const prev = value.levelStars[state.levelId] ?? 0;
      if (stars > prev) {
        value.levelStars = { ...value.levelStars, [state.levelId]: stars };
      }
    }
    unlockNew(state, 'gameover');
    await saveStats($state.snapshot(value) as LifetimeStats);
  }

  function clearLastUnlocked() {
    lastUnlocked = [];
  }

  async function reset() {
    value = emptyStats();
    lastUnlocked = [];
    await saveStats($state.snapshot(value) as LifetimeStats);
  }

  return {
    get value() {
      return value;
    },
    get loaded() {
      return loaded;
    },
    get lastUnlocked() {
      return lastUnlocked;
    },
    get dailyStreak() {
      return dailyStreakFromScores(value.dailyScores);
    },
    init,
    recordPlacement,
    recordGameOver,
    clearLastUnlocked,
    reset,
  };
}

export const stats = createStatsStore();
