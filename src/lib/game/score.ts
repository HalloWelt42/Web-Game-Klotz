import type { Piece } from './types';

export type ScoreBreakdown = {
  base: number;
  lineBonus: number;
  monoBonus: number;
  comboMultiplier: number;
  total: number;
};

export function scorePlacement(
  piece: Piece,
  clearedRows: number,
  clearedCols: number,
  comboBefore: number,
  monochromeLines: number = 0,
): ScoreBreakdown {
  const base = piece.kind === 'standard' || piece.kind === 'joker' ? piece.cells.length : 0;
  const totalLines = clearedRows + clearedCols;
  const lineBonus =
    totalLines === 0 ? 0 : Math.round(10 * totalLines * (1 + 0.5 * Math.max(0, totalLines - 1)));
  const monoBonus = monochromeLines * 25;
  const willCombo = totalLines > 0;
  const effectiveCombo = willCombo ? comboBefore + 1 : 0;
  const comboMultiplier = willCombo ? Math.min(3, 1 + 0.25 * (effectiveCombo - 1)) : 1;
  const total = Math.round((base + lineBonus + monoBonus) * comboMultiplier);
  return { base, lineBonus, monoBonus, comboMultiplier, total };
}
