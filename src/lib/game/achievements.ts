import type { GameState, LifetimeStats } from './types';

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  test: (ctx: AchievementContext) => boolean;
};

export type AchievementContext = {
  state: GameState;
  stats: LifetimeStats;
  triggeredAt: 'placement' | 'gameover';
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-place',
    title: 'Erster Stein',
    description: 'Lege deinen allerersten Stein.',
    icon: 'fa-cube',
    tier: 'bronze',
    test: ({ state }) => state.movesCount >= 1,
  },
  {
    id: 'first-clear',
    title: 'Erste Räumung',
    description: 'Vollende deine erste Reihe oder Spalte.',
    icon: 'fa-broom',
    tier: 'bronze',
    test: ({ stats }) => stats.rowsCleared + stats.colsCleared >= 1,
  },
  {
    id: 'combo-3',
    title: 'Combo Dreier',
    description: 'Erreiche eine Combo von 3.',
    icon: 'fa-bolt',
    tier: 'bronze',
    test: ({ stats }) => stats.highestCombo >= 3,
  },
  {
    id: 'combo-5',
    title: 'Combo Fünfer',
    description: 'Erreiche eine Combo von 5.',
    icon: 'fa-bolt-lightning',
    tier: 'silver',
    test: ({ stats }) => stats.highestCombo >= 5,
  },
  {
    id: 'combo-8',
    title: 'Combo Achter',
    description: 'Erreiche eine Combo von 8.',
    icon: 'fa-fire',
    tier: 'gold',
    test: ({ stats }) => stats.highestCombo >= 8,
  },
  {
    id: 'score-500',
    title: 'Halbtausend',
    description: 'Erreiche 500 Punkte in einer Partie.',
    icon: 'fa-star',
    tier: 'bronze',
    test: ({ state }) => state.score >= 500,
  },
  {
    id: 'score-2000',
    title: 'Zweitausend',
    description: 'Erreiche 2000 Punkte in einer Partie.',
    icon: 'fa-star-half-stroke',
    tier: 'silver',
    test: ({ state }) => state.score >= 2000,
  },
  {
    id: 'score-5000',
    title: 'Fünftausend',
    description: 'Erreiche 5000 Punkte in einer Partie.',
    icon: 'fa-trophy',
    tier: 'gold',
    test: ({ state }) => state.score >= 5000,
  },
  {
    id: 'rows-50',
    title: 'Reihenbrecher',
    description: 'Räume insgesamt 50 Reihen.',
    icon: 'fa-grip-lines',
    tier: 'silver',
    test: ({ stats }) => stats.rowsCleared >= 50,
  },
  {
    id: 'cols-50',
    title: 'Spaltenbrecher',
    description: 'Räume insgesamt 50 Spalten.',
    icon: 'fa-grip-lines-vertical',
    tier: 'silver',
    test: ({ stats }) => stats.colsCleared >= 50,
  },
  {
    id: 'rows-200',
    title: 'Reihen-Meister',
    description: 'Räume insgesamt 200 Reihen.',
    icon: 'fa-grip-lines',
    tier: 'gold',
    test: ({ stats }) => stats.rowsCleared >= 200,
  },
  {
    id: 'cols-200',
    title: 'Spalten-Meister',
    description: 'Räume insgesamt 200 Spalten.',
    icon: 'fa-grip-lines-vertical',
    tier: 'gold',
    test: ({ stats }) => stats.colsCleared >= 200,
  },
  {
    id: 'ten-games',
    title: 'Stammgast',
    description: 'Spiele 10 vollständige Partien.',
    icon: 'fa-gamepad',
    tier: 'bronze',
    test: ({ stats }) => stats.gamesPlayed >= 10,
  },
  {
    id: 'fifty-games',
    title: 'Viel-Spieler',
    description: 'Spiele 50 vollständige Partien.',
    icon: 'fa-medal',
    tier: 'silver',
    test: ({ stats }) => stats.gamesPlayed >= 50,
  },
  {
    id: 'hundred-games',
    title: 'Hundertfach',
    description: 'Spiele 100 vollständige Partien.',
    icon: 'fa-award',
    tier: 'gold',
    test: ({ stats }) => stats.gamesPlayed >= 100,
  },
  {
    id: 'daily-survivor',
    title: 'Daily-Survivor',
    description: 'Schließe deine erste Tages-Challenge ab.',
    icon: 'fa-calendar-check',
    tier: 'bronze',
    test: ({ stats }) => stats.dailyScores.length >= 1,
  },
  {
    id: 'daily-week',
    title: 'Sieben Tage',
    description: 'Spiele die Tages-Challenge an 7 verschiedenen Tagen.',
    icon: 'fa-calendar-week',
    tier: 'silver',
    test: ({ stats }) => stats.dailyScores.length >= 7,
  },
  {
    id: 'daily-month',
    title: 'Daily-Stammtisch',
    description: 'Spiele an 30 verschiedenen Tagen die Tages-Challenge.',
    icon: 'fa-calendar-days',
    tier: 'gold',
    test: ({ stats }) => stats.dailyScores.length >= 30,
  },
  {
    id: 'level-clear-1',
    title: 'Level geschafft',
    description: 'Erreiche das Ziel in einem Level.',
    icon: 'fa-flag-checkered',
    tier: 'bronze',
    test: ({ stats }) => stats.completedLevels.length >= 1,
  },
  {
    id: 'level-clear-5',
    title: 'Level-Gänger',
    description: 'Schließe 5 Levels ab.',
    icon: 'fa-flag',
    tier: 'silver',
    test: ({ stats }) => stats.completedLevels.length >= 5,
  },
  {
    id: 'level-clear-all',
    title: 'Endspiel',
    description: 'Schließe alle 10 Levels ab.',
    icon: 'fa-trophy',
    tier: 'gold',
    test: ({ stats }) => stats.completedLevels.length >= 10,
  },
  {
    id: 'special-bomb',
    title: 'Sprengmeister',
    description: 'Verdiene deine erste Bombe (Combo x2).',
    icon: 'fa-bomb',
    tier: 'bronze',
    test: ({ stats }) => stats.highestCombo >= 2,
  },
  {
    id: 'special-hammer',
    title: 'Hammerharte Combo',
    description: 'Verdiene deinen ersten Hammer (Combo x3).',
    icon: 'fa-hammer',
    tier: 'silver',
    test: ({ stats }) => stats.highestCombo >= 3,
  },
  {
    id: 'special-joker',
    title: 'Magier',
    description: 'Verdiene deinen ersten Joker (Combo x4).',
    icon: 'fa-wand-magic-sparkles',
    tier: 'gold',
    test: ({ stats }) => stats.highestCombo >= 4,
  },
  {
    id: 'mode-explorer',
    title: 'Modi-Entdecker',
    description: 'Spiele alle 6 Modi mindestens einmal.',
    icon: 'fa-compass',
    tier: 'silver',
    test: ({ stats }) =>
      Object.values(stats.perGameHigh).filter((v) => v > 0).length >= 6,
  },
];

export function evaluateAchievements(
  ctx: AchievementContext,
  currentlyUnlocked: string[],
): string[] {
  const unlocked = new Set(currentlyUnlocked);
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    try {
      if (a.test(ctx)) {
        unlocked.add(a.id);
        newly.push(a.id);
      }
    } catch {
      // ignoriere defekte Achievement-Tests
    }
  }
  return newly;
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
