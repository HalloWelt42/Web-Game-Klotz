import { describe, it, expect } from 'vitest';
import { scorePlacement } from '../src/lib/game/score';
import { pieceById } from '../src/lib/game/pieces';

describe('scorePlacement', () => {
  const i3 = pieceById('I3H')!;
  const o3 = pieceById('O3')!;

  it('gibt nur Basis-Punkte ohne Räumung', () => {
    const r = scorePlacement(i3, 0, 0, 0);
    expect(r.base).toBe(3);
    expect(r.lineBonus).toBe(0);
    expect(r.comboMultiplier).toBe(1);
    expect(r.total).toBe(3);
  });

  it('vergibt Linien-Bonus bei einer Räumung', () => {
    const r = scorePlacement(i3, 1, 0, 0);
    expect(r.lineBonus).toBe(10);
    expect(r.total).toBe(13);
  });

  it('skaliert Bonus bei mehreren Linien', () => {
    const r = scorePlacement(o3, 1, 1, 0);
    expect(r.lineBonus).toBe(30);
  });

  it('aktiviert Combo-Multiplikator ab zweitem Räumungszug', () => {
    const r1 = scorePlacement(i3, 1, 0, 0);
    const r2 = scorePlacement(i3, 1, 0, 1);
    expect(r2.comboMultiplier).toBeGreaterThan(r1.comboMultiplier);
  });

  it('begrenzt den Combo-Multiplikator auf x3', () => {
    const r = scorePlacement(i3, 1, 0, 100);
    expect(r.comboMultiplier).toBe(3);
  });

  it('setzt Combo zurück, wenn nichts geräumt wurde', () => {
    const r = scorePlacement(i3, 0, 0, 5);
    expect(r.comboMultiplier).toBe(1);
  });
});
