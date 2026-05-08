import type { Goal } from './types';

export type Level = {
  id: string;
  title: string;
  description: string;
  goal: Goal;
  movesLimit: number;
  blockCount: number;
  iceCount: number;
};

export const LEVELS: Level[] = [
  {
    id: 'level-1',
    title: 'Aufwärmrunde',
    description: 'Erreiche 80 Punkte in 14 Zügen.',
    goal: { points: 80 },
    movesLimit: 14,
    blockCount: 0,
    iceCount: 0,
  },
  {
    id: 'level-2',
    title: 'Erste Hindernisse',
    description: '110 Punkte in 16 Zügen, zwei Blocks im Brett.',
    goal: { points: 110 },
    movesLimit: 16,
    blockCount: 2,
    iceCount: 0,
  },
  {
    id: 'level-3',
    title: 'Eisbrecher',
    description: '4 Linien räumen in 18 Zügen, mit Eisfeldern.',
    goal: { clears: 4 },
    movesLimit: 18,
    blockCount: 0,
    iceCount: 3,
  },
  {
    id: 'level-4',
    title: 'Mauerbauer',
    description: '160 Punkte in 20 Zügen, drei Blocks und zwei Eis.',
    goal: { points: 160 },
    movesLimit: 20,
    blockCount: 3,
    iceCount: 2,
  },
  {
    id: 'level-5',
    title: 'Combo-Sucher',
    description: '6 Linien räumen in 22 Zügen.',
    goal: { clears: 6 },
    movesLimit: 22,
    blockCount: 2,
    iceCount: 3,
  },
  {
    id: 'level-6',
    title: 'Gut gemischt',
    description: '220 Punkte in 24 Zügen.',
    goal: { points: 220 },
    movesLimit: 24,
    blockCount: 4,
    iceCount: 3,
  },
  {
    id: 'level-7',
    title: 'Spaltenmacher',
    description: '4 Spalten in 24 Zügen räumen.',
    goal: { cols: 4 },
    movesLimit: 24,
    blockCount: 3,
    iceCount: 3,
  },
  {
    id: 'level-8',
    title: 'Belastungstest',
    description: '260 Punkte in 28 Zügen, viele Hindernisse.',
    goal: { points: 260 },
    movesLimit: 28,
    blockCount: 5,
    iceCount: 4,
  },
  {
    id: 'level-9',
    title: 'Reihenkönig',
    description: '8 Linien räumen in 28 Zügen.',
    goal: { clears: 8 },
    movesLimit: 28,
    blockCount: 4,
    iceCount: 5,
  },
  {
    id: 'level-10',
    title: 'Endspiel',
    description: '360 Punkte in 32 Zügen, brutaler Aufbau.',
    goal: { points: 360 },
    movesLimit: 32,
    blockCount: 6,
    iceCount: 5,
  },
];

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
