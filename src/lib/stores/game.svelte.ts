import {
  canSkip,
  canUndo,
  isStuckButRescuable,
  newGame,
  rotatePieceInSlot,
  skip as engineSkip,
  tickTimer,
  tryPlace,
  tryUseSpecial,
  undo as engineUndo,
} from '../game/engine';
import type { SpecialKind } from '../game/types';
import {
  loadEndlessSave,
  loadHighscore,
  saveEndlessSave,
  saveHighscore,
  saveReplay,
} from '../game/persistence';
import type { GameMode, GameState } from '../game/types';
import { playSfx, vibrate } from '../audio/sfx';
import { settings } from './settings.svelte';
import { stats } from './stats.svelte';

type DragState =
  | { active: false }
  | {
      active: true;
      slotIndex: 0 | 1 | 2;
      pointer: { x: number; y: number };
      anchor: { x: number; y: number };
      hover: { x: number; y: number } | null;
    };

export type ToastEvent = {
  id: number;
  kind: 'achievement' | 'goal' | 'mono' | 'combo';
  text: string;
  icon: string;
  at: number;
};

export type FxEvent = {
  id: number;
  kind:
    | 'shock'
    | 'confetti'
    | 'pop'
    | 'bomb-burst'
    | 'hammer-strike'
    | 'joker-sparkle'
    | 'screen-shake'
    | 'special-earned'
    | 'row-wipe'
    | 'col-wipe'
    | 'coin'
    | 'star-burst';
  x: number;
  y: number;
  payload?: number | string;
  at: number;
};

let nextToastId = 1;
let nextFxId = 1;

function createGameStore() {
  let state = $state<GameState>(newGame('endless'));
  let highscore = $state(0);
  let drag = $state<DragState>({ active: false });
  let lastCleared = $state<{ rows: number[]; cols: number[]; at: number } | null>(null);
  let resumePrompt = $state<GameState | null>(null);
  let initialised = $state(false);
  let toasts = $state<ToastEvent[]>([]);
  let fx = $state<FxEvent[]>([]);
  let boardCenter = $state<{ x: number; y: number }>({ x: 0, y: 0 });
  let pendingSpecial = $state<SpecialKind | null>(null);
  let paused = $state(false);
  let gameEndHandled = false;

  function setBoardCenter(x: number, y: number) {
    boardCenter = { x, y };
  }

  async function init() {
    highscore = await loadHighscore('endless');
    const saved = await loadEndlessSave();
    if (saved && saved.status === 'running' && saved.mode === 'endless') {
      resumePrompt = saved;
    }
    initialised = true;
  }

  async function reloadHighscoreFor(mode: GameMode) {
    highscore = await loadHighscore(mode);
  }

  async function startNew(mode: GameMode = 'endless', seed?: number, levelId?: string) {
    state = newGame(mode, seed, levelId, { boardSizeOverride: settings.value.boardSize });
    resumePrompt = null;
    drag = { active: false };
    lastCleared = null;
    fx = [];
    toasts = [];
    pendingSpecial = null;
    paused = false;
    gameEndHandled = false;
    if (mode === 'endless') {
      await saveEndlessSave(null);
    }
    highscore = await loadHighscore(mode);
  }

  function resume() {
    if (!resumePrompt) return;
    state = resumePrompt;
    resumePrompt = null;
  }

  async function persist() {
    if (state.mode === 'endless') {
      await saveEndlessSave($state.snapshot(state) as GameState);
    }
  }

  function pushToast(t: Omit<ToastEvent, 'id' | 'at'>) {
    const ev: ToastEvent = { ...t, id: nextToastId++, at: Date.now() };
    toasts = [...toasts, ev];
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== ev.id);
    }, 3500);
  }

  function pushFx(f: Omit<FxEvent, 'id' | 'at'>) {
    const ev: FxEvent = { ...f, id: nextFxId++, at: Date.now() };
    fx = [...fx, ev];
    const ttl = ev.kind === 'coin' ? 1800 : ev.kind === 'star-burst' ? 2000 : 1200;
    setTimeout(() => {
      fx = fx.filter((x) => x.id !== ev.id);
    }, ttl);
  }

  function startDrag(
    slotIndex: 0 | 1 | 2,
    pointer: { x: number; y: number },
    anchor: { x: number; y: number },
  ) {
    if (state.status !== 'running' || paused) return;
    const slot = state.pool[slotIndex];
    if (!slot || slot.consumed) return;
    drag = { active: true, slotIndex, pointer, anchor, hover: null };
  }

  function updateDrag(pointer: { x: number; y: number }, hover: { x: number; y: number } | null) {
    if (!drag.active) return;
    drag = { ...drag, pointer, hover };
  }

  function endDrag(): { placed: boolean } {
    if (!drag.active) return { placed: false };
    const { slotIndex, hover } = drag;
    drag = { active: false };
    if (!hover) return { placed: false };
    return commitPlace(slotIndex, hover.x, hover.y);
  }

  function cancelDrag() {
    drag = { active: false };
  }

  function commitPlace(slotIndex: 0 | 1 | 2, x: number, y: number): { placed: boolean } {
    const prevSpecials = { ...state.specials };
    const outcome = tryPlace($state.snapshot(state) as GameState, slotIndex, x, y);
    if (!outcome) return { placed: false };

    state = outcome.state;
    const earned: { kind: SpecialKind; icon: string; label: string }[] = [];
    if (state.specials.bomb > prevSpecials.bomb)
      earned.push({ kind: 'bomb', icon: 'fa-bomb', label: 'Bombe verdient' });
    if (state.specials.hammer > prevSpecials.hammer)
      earned.push({ kind: 'hammer', icon: 'fa-hammer', label: 'Hammer verdient' });
    if (state.specials.joker > prevSpecials.joker)
      earned.push({ kind: 'joker', icon: 'fa-wand-magic-sparkles', label: 'Joker verdient' });
    for (const e of earned) {
      pushToast({ kind: 'achievement', text: e.label, icon: e.icon });
      pushFx({ kind: 'special-earned', x: 0, y: 0, payload: e.kind });
    }
    if (earned.length > 0) {
      playSfx('earned', settings.value.sound);
      vibrate([30, 40, 30, 40, 30], settings.value.haptics);
    }
    void stats.recordPlacement(
      state,
      outcome.cleared.rows.length,
      outcome.cleared.cols.length,
    );

    const linesCleared = outcome.cleared.rows.length + outcome.cleared.cols.length;
    const gained = outcome.pointsGained;
    if (gained > 0) {
      pushFx({ kind: 'pop', x: 0, y: 0, payload: `+${gained}` });
    }
    if (linesCleared > 0) {
      lastCleared = {
        rows: outcome.cleared.rows,
        cols: outcome.cleared.cols,
        at: Date.now(),
      };
      for (const r of outcome.cleared.rows) pushFx({ kind: 'row-wipe', x: 0, y: r });
      for (const c of outcome.cleared.cols) pushFx({ kind: 'col-wipe', x: c, y: 0 });
      // Coins fliegen vom Brett zum Score, gestaffelt
      const coinCount = Math.min(10, Math.max(3, Math.round(gained / 8)));
      for (let i = 0; i < coinCount; i++) {
        pushFx({ kind: 'coin', x: i, y: 0, payload: 60 + i * 55 });
      }
      playSfx('clear', settings.value.sound, { combo: state.combo });
      playSfx('coin-jingle', settings.value.sound, { combo: state.combo });
      vibrate(state.combo > 1 ? [25, 30, 25] : 30, settings.value.haptics);
      pushFx({ kind: 'shock', x: 0, y: 0 });
      if (state.combo >= 3) {
        pushFx({ kind: 'confetti', x: 0, y: 0 });
        pushToast({
          kind: 'combo',
          text: `Combo x${state.combo}!`,
          icon: 'fa-bolt',
        });
      }
      if (outcome.monochromeBonusLines > 0) {
        pushToast({
          kind: 'mono',
          text: `Einfarbig! +${outcome.monochromeBonusLines * 25}`,
          icon: 'fa-paintbrush',
        });
      }
    } else {
      const slot = state.pool[slotIndex];
      const cellCount = slot?.piece.cells.length ?? 1;
      playSfx('place', settings.value.sound, { cells: cellCount });
      vibrate(10, settings.value.haptics);
    }

    if (stats.lastUnlocked.length > 0) {
      for (const id of stats.lastUnlocked) {
        const ach = ACHIEVEMENT_LOOKUP[id];
        if (ach) {
          pushToast({ kind: 'achievement', text: ach.title, icon: ach.icon });
        }
      }
      stats.clearLastUnlocked();
    }

    if (state.status === 'gameover' || state.status === 'won') {
      void handleGameEnd();
    } else {
      if (isStuckButRescuable(state)) {
        pushToast({
          kind: 'achievement',
          text: 'Pool blockiert -- Special einsetzen!',
          icon: 'fa-life-ring',
        });
      }
      void persist();
    }
    return { placed: true };
  }

  async function handleGameEnd() {
    if (gameEndHandled) return;
    gameEndHandled = true;
    if (state.status === 'gameover') {
      playSfx('gameover', settings.value.sound);
      vibrate([20, 40, 60], settings.value.haptics);
    } else {
      playSfx('won', settings.value.sound);
      pushFx({ kind: 'confetti', x: 0, y: 0 });
      pushFx({ kind: 'star-burst', x: 0, y: 0 });
      setTimeout(() => playSfx('reward-stars', settings.value.sound), 300);
      setTimeout(() => pushFx({ kind: 'screen-shake', x: 0, y: 0 }), 250);
      vibrate([60, 40, 60, 40, 100, 40, 80], settings.value.haptics);
    }
    const snap = $state.snapshot(state) as GameState;
    await stats.recordGameOver(snap);
    if (snap.score > highscore) {
      highscore = snap.score;
      await saveHighscore(snap.mode, highscore);
    }
    if (snap.mode === 'endless') {
      await saveEndlessSave(null);
    }
    await saveReplay(snap.replay);
    if (stats.lastUnlocked.length > 0) {
      for (const id of stats.lastUnlocked) {
        const ach = ACHIEVEMENT_LOOKUP[id];
        if (ach) {
          pushToast({ kind: 'achievement', text: ach.title, icon: ach.icon });
        }
      }
      stats.clearLastUnlocked();
    }
  }

  function performUndo() {
    if (!canUndo(state)) return;
    state = engineUndo($state.snapshot(state) as GameState);
    void persist();
  }

  function performSkip(slotIndex: 0 | 1 | 2) {
    if (!canSkip(state, slotIndex)) return;
    state = engineSkip($state.snapshot(state) as GameState, slotIndex);
    void persist();
  }

  function performRotate(slotIndex: 0 | 1 | 2) {
    if (!state.rotationAllowed) return;
    state = rotatePieceInSlot($state.snapshot(state) as GameState, slotIndex);
  }

  function selectSpecial(kind: SpecialKind | null) {
    if (kind && state.specials[kind] <= 0) {
      pendingSpecial = null;
      return;
    }
    pendingSpecial = kind;
  }

  function useSpecialAt(x: number, y: number): boolean {
    const kind = pendingSpecial;
    if (!kind) return false;
    const out = tryUseSpecial($state.snapshot(state) as GameState, kind, x, y);
    if (!out) return false;
    state = out.state;
    void stats.recordPlacement(state, out.cleared.rows.length, out.cleared.cols.length);
    const lines = out.cleared.rows.length + out.cleared.cols.length;
    playSfx(kind, settings.value.sound);
    if (kind === 'bomb') {
      pushFx({ kind: 'bomb-burst', x, y });
      pushFx({ kind: 'screen-shake', x: 0, y: 0 });
      vibrate([60, 40, 80], settings.value.haptics);
    } else if (kind === 'hammer') {
      pushFx({ kind: 'hammer-strike', x, y });
      vibrate([20, 20, 40], settings.value.haptics);
    } else if (kind === 'joker') {
      pushFx({ kind: 'joker-sparkle', x, y });
      vibrate([15, 15, 15, 15], settings.value.haptics);
    }
    if (lines > 0) {
      pushFx({ kind: 'shock', x: 0, y: 0 });
      for (const r of out.cleared.rows) pushFx({ kind: 'row-wipe', x: 0, y: r });
      for (const c of out.cleared.cols) pushFx({ kind: 'col-wipe', x: c, y: 0 });
      playSfx('clear', settings.value.sound, { combo: state.combo });
      vibrate(state.combo > 1 ? [25, 30, 25] : 30, settings.value.haptics);
    }
    if (state.status === 'gameover' || state.status === 'won') void handleGameEnd();
    else {
      if (isStuckButRescuable(state)) {
        pushToast({
          kind: 'achievement',
          text: 'Pool weiter blockiert -- noch ein Special',
          icon: 'fa-life-ring',
        });
      }
      void persist();
    }
    // Nach jedem Use zurueck auf neutral -- der User waehlt explizit neu
    pendingSpecial = null;
    return true;
  }

  function tickTime(deltaSeconds: number) {
    if (state.timeLimit === undefined) return;
    if (state.status !== 'running') return;
    const before = state.status;
    state = tickTimer($state.snapshot(state) as GameState, deltaSeconds);
    if (before === 'running' && state.status === 'gameover') {
      void handleGameEnd();
    }
  }

  return {
    get state() {
      return state;
    },
    get highscore() {
      return highscore;
    },
    get drag() {
      return drag;
    },
    get lastCleared() {
      return lastCleared;
    },
    get resumePrompt() {
      return resumePrompt;
    },
    get initialised() {
      return initialised;
    },
    get toasts() {
      return toasts;
    },
    get fx() {
      return fx;
    },
    get boardCenter() {
      return boardCenter;
    },
    get pendingSpecial() {
      return pendingSpecial;
    },
    get paused() {
      return paused;
    },
    pause() {
      if (state.status === 'running') paused = true;
    },
    unpause() {
      paused = false;
    },
    togglePause() {
      if (state.status !== 'running') return;
      paused = !paused;
    },
    surrender() {
      if (state.status !== 'running') return;
      paused = false;
      state = { ...state, status: 'gameover' };
      void handleGameEnd();
    },
    init,
    reloadHighscoreFor,
    startNew,
    resume,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    commitPlace,
    performUndo,
    performSkip,
    performRotate,
    tickTime,
    setBoardCenter,
    selectSpecial,
    useSpecialAt,
    dismissGameEnd() {
      if (state.status === 'gameover' || state.status === 'won') {
        state = { ...state, status: 'running' };
      }
    },
  };
}

import { ACHIEVEMENTS } from '../game/achievements';
const ACHIEVEMENT_LOOKUP: Record<string, { title: string; icon: string }> = {};
for (const a of ACHIEVEMENTS) ACHIEVEMENT_LOOKUP[a.id] = { title: a.title, icon: a.icon };

export const game = createGameStore();
