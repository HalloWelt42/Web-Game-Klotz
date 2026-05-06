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
    description: 'Erreiche 80 Punkte in 12 Zügen.',
    goal: { points: 80 },
    movesLimit: 12,
    blockCount: 0,
    iceCount: 0,
  },
  {
    id: 'level-2',
    title: 'Erste Hindernisse',
    description: '160 Punkte in 14 Zügen, zwei Blocks im Brett.',
    goal: { points: 160 },
    movesLimit: 14,
    blockCount: 2,
    iceCount: 0,
  },
  {
    id: 'level-3',
    title: 'Eisbrecher',
    description: '5 Linien räumen in 16 Zügen, mit Eisfeldern.',
    goal: { clears: 5 },
    movesLimit: 16,
    blockCount: 0,
    iceCount: 4,
  },
  {
    id: 'level-4',
    title: 'Mauerbauer',
    description: '250 Punkte in 18 Zügen, vier Blocks und zwei Eis.',
    goal: { points: 250 },
    movesLimit: 18,
    blockCount: 4,
    iceCount: 2,
  },
  {
    id: 'level-5',
    title: 'Combo-Sucher',
    description: '8 Linien räumen in 20 Zügen.',
    goal: { clears: 8 },
    movesLimit: 20,
    blockCount: 2,
    iceCount: 4,
  },
  {
    id: 'level-6',
    title: 'Gut gemischt',
    description: '400 Punkte in 22 Zügen.',
    goal: { points: 400 },
    movesLimit: 22,
    blockCount: 5,
    iceCount: 4,
  },
  {
    id: 'level-7',
    title: 'Spaltenmacher',
    description: '6 Spalten in 22 Zügen räumen.',
    goal: { cols: 6 },
    movesLimit: 22,
    blockCount: 4,
    iceCount: 4,
  },
  {
    id: 'level-8',
    title: 'Belastungstest',
    description: '600 Punkte in 25 Zügen, viele Hindernisse.',
    goal: { points: 600 },
    movesLimit: 25,
    blockCount: 7,
    iceCount: 5,
  },
  {
    id: 'level-9',
    title: 'Reihenkönig',
    description: '12 Linien räumen in 24 Zügen.',
    goal: { clears: 12 },
    movesLimit: 24,
    blockCount: 6,
    iceCount: 6,
  },
  {
    id: 'level-10',
    title: 'Endspiel',
    description: '900 Punkte in 28 Zügen, brutaler Aufbau.',
    goal: { points: 900 },
    movesLimit: 28,
    blockCount: 8,
    iceCount: 6,
  },
];

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
