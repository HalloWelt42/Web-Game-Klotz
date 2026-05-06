import { get, set, del, createStore } from 'idb-keyval';
import { DEFAULT_BOARD_SIZE } from './types';
import type { GameMode, GameState, LifetimeStats, Profile, Replay, Settings } from './types';

const store = createStore('klotz-db', 'klotz-store');

const KEY = {
  saveEndless: 'klotz:save:endless',
  highscore: (mode: GameMode) => `klotz:highscore:${mode}`,
  stats: 'klotz:stats',
  settings: 'klotz:settings',
  profile: 'klotz:profile',
  replays: 'klotz:replays',
};

export async function loadEndlessSave(): Promise<GameState | null> {
  return (await get(KEY.saveEndless, store)) ?? null;
}

export async function saveEndlessSave(state: GameState | null): Promise<void> {
  if (state === null || state.status !== 'running' || state.mode !== 'endless') {
    await del(KEY.saveEndless, store);
    return;
  }
  await set(KEY.saveEndless, state, store);
}

export async function loadHighscore(mode: GameMode): Promise<number> {
  return (await get<number>(KEY.highscore(mode), store)) ?? 0;
}

export async function saveHighscore(mode: GameMode, value: number): Promise<void> {
  await set(KEY.highscore(mode), value, store);
}

export function emptyStats(): LifetimeStats {
  return {
    gamesPlayed: 0,
    totalPoints: 0,
    highestCombo: 0,
    longestStreak: 0,
    rowsCleared: 0,
    colsCleared: 0,
    heatmap: Array.from({ length: DEFAULT_BOARD_SIZE }, () => Array(DEFAULT_BOARD_SIZE).fill(0)),
    perGameHigh: {
      endless: 0,
      daily: 0,
      level: 0,
      timed: 0,
      reverse: 0,
      shrink: 0,
    },
    achievements: [],
    dailyScores: [],
    completedLevels: [],
    levelStars: {},
  };
}

export async function loadStats(): Promise<LifetimeStats> {
  const stored = (await get<LifetimeStats>(KEY.stats, store)) ?? null;
  if (!stored) return emptyStats();
  const e = emptyStats();
  return {
    ...e,
    ...stored,
    heatmap:
      stored.heatmap && stored.heatmap.length === DEFAULT_BOARD_SIZE ? stored.heatmap : e.heatmap,
    perGameHigh: { ...e.perGameHigh, ...(stored.perGameHigh ?? {}) },
    achievements: stored.achievements ?? [],
    dailyScores: stored.dailyScores ?? [],
    completedLevels: stored.completedLevels ?? [],
    levelStars: stored.levelStars ?? {},
  };
}

export async function saveStats(stats: LifetimeStats): Promise<void> {
  await set(KEY.stats, stats, store);
}

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    palette: 'default',
    colorblind: false,
    sound: true,
    haptics: true,
    boardSize: 10,
    modeHintsShown: [],
  };
}

export async function loadSettings(): Promise<Settings> {
  return { ...defaultSettings(), ...((await get<Partial<Settings>>(KEY.settings, store)) ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await set(KEY.settings, settings, store);
}

export async function loadProfile(): Promise<Profile> {
  const stored = (await get<Profile>(KEY.profile, store)) ?? null;
  if (stored) return stored;
  const created: Profile = { pseudonym: 'Klotzkönig', createdAt: Date.now() };
  await set(KEY.profile, created, store);
  return created;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await set(KEY.profile, profile, store);
}

export async function loadReplays(): Promise<Replay[]> {
  return (await get<Replay[]>(KEY.replays, store)) ?? [];
}

export async function saveReplay(replay: Replay): Promise<void> {
  const existing = await loadReplays();
  const next = [replay, ...existing].slice(0, 25);
  await set(KEY.replays, next, store);
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    del(KEY.saveEndless, store),
    del(KEY.stats, store),
    del(KEY.settings, store),
    del(KEY.profile, store),
    del(KEY.replays, store),
    del(KEY.highscore('endless'), store),
    del(KEY.highscore('daily'), store),
    del(KEY.highscore('level'), store),
    del(KEY.highscore('timed'), store),
    del(KEY.highscore('reverse'), store),
    del(KEY.highscore('shrink'), store),
  ]);
}
