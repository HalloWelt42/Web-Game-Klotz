<script lang="ts">
  import './lib/styles/global.css';

  import { onMount, untrack as svelteUntrack } from 'svelte';
  import { game } from './lib/stores/game.svelte';
  import { settings } from './lib/stores/settings.svelte';
  import { stats } from './lib/stores/stats.svelte';
  import Board from './lib/ui/Board.svelte';
  import PiecePool from './lib/ui/PiecePool.svelte';
  import SpecialsBar from './lib/ui/SpecialsBar.svelte';
  import SidebarAchievements from './lib/ui/SidebarAchievements.svelte';
  import SidebarReplays from './lib/ui/SidebarReplays.svelte';
  import ScoreBar from './lib/ui/ScoreBar.svelte';
  import GameOverDialog from './lib/ui/GameOverDialog.svelte';
  import TutorialOverlay from './lib/ui/TutorialOverlay.svelte';
  import SettingsModal from './lib/ui/Settings.svelte';
  import StatsModal from './lib/ui/Stats.svelte';
  import AchievementsModal from './lib/ui/AchievementsModal.svelte';
  import ReplayModal from './lib/ui/ReplayModal.svelte';
  import LevelPicker from './lib/ui/LevelPicker.svelte';
  import ModeHint from './lib/ui/ModeHint.svelte';
  import Modal from './lib/ui/Modal.svelte';
  import DonateModal from './lib/ui/DonateModal.svelte';
  import NewGameWizard from './lib/ui/NewGameWizard.svelte';
  import PauseOverlay from './lib/ui/PauseOverlay.svelte';
  import MainMenu from './lib/ui/MainMenu.svelte';
  import DragGhost from './lib/ui/DragGhost.svelte';
  import ToastStack from './lib/ui/ToastStack.svelte';
  import FxOverlay from './lib/ui/FxOverlay.svelte';
  import { canUndo } from './lib/game/engine';
  import type { GameMode } from './lib/game/types';
  import { newFromReplay } from './lib/game/engine';
  import type { Replay } from './lib/game/types';
  import { router, routeToPath } from './lib/router.svelte';

  const TUTORIAL_KEY = 'klotz:tutorial-shown';

  let boardEl = $state<HTMLDivElement | null>(null);
  let cellSize = $state(36);
  const cellGap = 4;

  let showTutorial = $state(false);
  let showSettings = $state(false);
  let showStats = $state(false);
  let showAchievements = $state(false);
  let showReplays = $state(false);
  let showWizard = $state(false);
  let modeHint = $state<GameMode | null>(null);
  let showLevelPicker = $state(false);
  let showDonate = $state(false);
  let showSurrenderConfirm = $state(false);

  let initialised = $state(false);

  async function applyRouteAction() {
    const r = router.route;
    if (r.kind === 'mode') {
      // Bereits laufende Partie im selben Modus nicht ueberschreiben
      const sizeOk = !r.size || settings.value.boardSize === r.size;
      if (
        game.state.mode === r.mode &&
        game.state.status === 'running' &&
        game.state.movesCount > 0 &&
        sizeOk
      ) {
        return;
      }
      if (r.size) await settings.update({ boardSize: r.size });
      await game.startNew(r.mode);
      maybeShowModeHint(r.mode);
    } else if (r.kind === 'level') {
      if (
        game.state.mode === 'level' &&
        game.state.levelId === r.id &&
        game.state.status === 'running'
      ) {
        return;
      }
      await game.startNew('level', undefined, r.id);
      maybeShowModeHint('level');
    } else if (r.kind === 'seed') {
      if (r.size) await settings.update({ boardSize: r.size });
      await game.startNew('endless', r.seed);
    } else if (r.kind === 'replay') {
      const replay: Replay = { mode: r.mode, seed: r.seed, moves: r.moves };
      const replayed = newFromReplay(replay);
      await game.startNew(replayed.mode, replayed.seed);
    }
  }

  function maybeShowModeHint(mode: GameMode) {
    if (!settings.value.modeHintsShown.includes(mode)) {
      modeHint = mode;
      void settings.update({
        modeHintsShown: [...settings.value.modeHintsShown, mode],
      });
    }
  }

  $effect(() => {
    const r = router.route;
    showStats = r.kind === 'stats';
    showAchievements = r.kind === 'achievements';
    showReplays = r.kind === 'replays';
    showSettings = r.kind === 'settings';
    showTutorial = r.kind === 'help';
    showLevelPicker = r.kind === 'levels';
    showDonate = r.kind === 'donate';
    if (
      initialised &&
      (r.kind === 'mode' || r.kind === 'level' || r.kind === 'seed' || r.kind === 'replay')
    ) {
      // applyRouteAction in untrack -- sonst tracked das $effect den
      // Spielzustand und triggert sich beim startNew sofort wieder
      svelteUntrack(() => {
        void applyRouteAction();
      });
    }
  });

  onMount(async () => {
    router.init();
    await Promise.all([settings.init(), stats.init(), game.init()]);

    const r = router.route;
    if (r.kind === 'replay' || r.kind === 'seed' || r.kind === 'mode' || r.kind === 'level') {
      await applyRouteAction();
      if (r.kind === 'replay') {
        router.navigate({ kind: 'mode', mode: r.mode }, { replace: true });
      }
      initialised = true;
      return;
    }

    if (!localStorage.getItem(TUTORIAL_KEY)) {
      showTutorial = true;
      router.navigate({ kind: 'help' }, { replace: true });
    }
    initialised = true;
  });

  function closeTutorial() {
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      /* ignore */
    }
    closeOverlay();
  }

  function showTutorialAgain() {
    router.navigate({ kind: 'help' });
  }

  function closeOverlay() {
    const r = router.route;
    if (
      r.kind === 'stats' ||
      r.kind === 'achievements' ||
      r.kind === 'replays' ||
      r.kind === 'settings' ||
      r.kind === 'help' ||
      r.kind === 'levels' ||
      r.kind === 'donate'
    ) {
      // Wenn eine Partie laeuft, zurueck zum Brett
      // Sonst zurueck zum Hauptmenue
      if (game.state.status === 'running' && game.state.movesCount > 0) {
        router.navigate({ kind: 'mode', mode: game.state.mode });
      } else {
        router.navigate({ kind: 'home' });
      }
    }
  }

  function openOverlay(
    kind: 'stats' | 'achievements' | 'replays' | 'settings' | 'levels' | 'donate',
  ) {
    router.navigate({ kind });
  }

  function pickMode(mode: GameMode) {
    if (mode === 'level') {
      router.navigate({ kind: 'levels' });
      return;
    }
    router.navigate({ kind: 'mode', mode });
  }

  function pickLevel(levelId: string) {
    router.navigate({ kind: 'level', id: levelId });
  }

  function startCustomSeed(seed: number, raw: string) {
    router.navigate({ kind: 'seed', seed, raw });
  }

  $effect(() => {
    const theme = settings.value.theme;
    let resolved: 'light' | 'dark' = theme === 'system' ? 'light' : theme;
    if (theme === 'system' && typeof window !== 'undefined') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.palette = settings.value.palette;
  });

  $effect(() => {
    if (!boardEl) return;
    const measure = () => {
      const rect = boardEl!.getBoundingClientRect();
      const size = game.state.boardSize;
      const totalGap = (size - 1) * cellGap;
      const padding = 20;
      svelteUntrack(() => {
        cellSize = Math.max(20, Math.floor((rect.width - padding - totalGap) / size));
        game.setBoardCenter(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(boardEl);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  });

  $effect(() => {
    if (!game.drag.active) return;

    function updateFromPointer(clientX: number, clientY: number) {
      const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      let hover: { x: number; y: number } | null = null;
      if (
        target &&
        target.classList.contains('cell') &&
        target.dataset.x !== undefined &&
        target.dataset.y !== undefined
      ) {
        const cx = parseInt(target.dataset.x, 10);
        const cy = parseInt(target.dataset.y, 10);
        if (game.drag.active) {
          hover = { x: cx - game.drag.anchor.x, y: cy - game.drag.anchor.y };
        }
      }
      game.updateDrag({ x: clientX, y: clientY }, hover);
    }

    function onMove(e: PointerEvent) {
      updateFromPointer(e.clientX, e.clientY);
    }

    function onUp(e: PointerEvent) {
      updateFromPointer(e.clientX, e.clientY);
      game.endDrag();
    }

    function onCancel() {
      game.cancelDrag();
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  });

  $effect(() => {
    if (game.state.timeLimit === undefined) return;
    if (game.state.status !== 'running' || game.paused) return;
    const handle = setInterval(() => game.tickTime(1), 1000);
    return () => clearInterval(handle);
  });

  function handleGlobalKey(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    // Wenn ein Modal/Overlay offen ist, hat es Vorrang
    if (
      showWizard ||
      showSettings ||
      showStats ||
      showAchievements ||
      showReplays ||
      showDonate ||
      showLevelPicker ||
      showTutorial ||
      showSurrenderConfirm
    ) {
      return;
    }
    if (game.state.status === 'running') {
      event.preventDefault();
      game.togglePause();
    }
  }

  function handlePickup(event: {
    slotIndex: 0 | 1 | 2;
    pointer: { x: number; y: number };
    anchor: { x: number; y: number };
  }) {
    game.startDrag(event.slotIndex, event.pointer, event.anchor);
  }
</script>

<header class="topbar">
  <div class="title">
    <i class="fa-solid fa-cubes"></i>
    <span>Klotz</span>
    {#if stats.dailyStreak > 0}
      <span
        class="streak"
        title={`Daily-Streak: ${stats.dailyStreak} Tag${stats.dailyStreak === 1 ? '' : 'e'}`}
      >
        <i class="fa-solid fa-fire"></i>
        <span>{stats.dailyStreak}</span>
      </span>
    {/if}
  </div>
  <div class="actions">
    <button
      class="ghost"
      title="Letzten Zug rueckgaengig"
      aria-label="Letzten Zug rueckgaengig"
      disabled={!canUndo(game.state)}
      onclick={() => game.performUndo()}
    >
      <i class="fa-solid fa-arrow-rotate-left"></i>
    </button>
    <button
      class="ghost"
      title="Pause (Esc)"
      aria-label="Pause"
      disabled={game.state.status !== 'running'}
      onclick={() => game.togglePause()}
    >
      <i class={`fa-solid ${game.paused ? 'fa-play' : 'fa-pause'}`}></i>
    </button>
    <button
      class="ghost"
      title="Partie beenden"
      aria-label="Partie beenden"
      disabled={game.state.status !== 'running'}
      onclick={() => (showSurrenderConfirm = true)}
    >
      <i class="fa-solid fa-flag"></i>
    </button>
    <button
      class="ghost new-game"
      title="Neue Partie / Modus waehlen"
      aria-label="Neue Partie"
      onclick={() => (showWizard = true)}
    >
      <i class="fa-solid fa-shapes"></i>
    </button>
    <button
      class="ghost"
      title="Erfolge"
      aria-label="Erfolge"
      onclick={() => openOverlay('achievements')}
    >
      <i class="fa-solid fa-trophy"></i>
    </button>
    <button
      class="ghost"
      title="Replays"
      aria-label="Replays"
      onclick={() => openOverlay('replays')}
    >
      <i class="fa-solid fa-share-nodes"></i>
    </button>
    <button
      class="ghost"
      title="Statistik"
      aria-label="Statistik"
      onclick={() => openOverlay('stats')}
    >
      <i class="fa-solid fa-chart-simple"></i>
    </button>
    <button
      class="ghost donate-btn"
      title="Danke sagen / Spende"
      aria-label="Danke sagen"
      onclick={() => openOverlay('donate')}
    >
      <i class="fa-solid fa-heart"></i>
    </button>
    <button
      class="ghost"
      title="Einstellungen"
      aria-label="Einstellungen"
      onclick={() => openOverlay('settings')}
    >
      <i class="fa-solid fa-gear"></i>
    </button>
  </div>
</header>

<svelte:window onkeydown={handleGlobalKey} />

<main class:home={router.route.kind === 'home'}>
  {#if router.route.kind === 'home'}
    <MainMenu onStartNew={() => (showWizard = true)} />
  {:else}
    <aside class="side left">
      <SidebarAchievements />
    </aside>

    <section class="center">
      <ScoreBar />
      <div class="board-wrap">
        <Board boardElement={(el) => (boardEl = el)} />
      </div>
      <PiecePool onPickup={handlePickup} />
      <SpecialsBar />
    </section>

    <aside class="side right">
      <SidebarReplays />
    </aside>
  {/if}
</main>

<DragGhost cellSize={cellSize} gap={cellGap} />

<ToastStack />

<FxOverlay />

<GameOverDialog />

<TutorialOverlay open={showTutorial} onClose={closeTutorial} />

<SettingsModal
  open={showSettings}
  onClose={closeOverlay}
  onShowTutorial={showTutorialAgain}
/>

<StatsModal open={showStats} onClose={closeOverlay} />

<AchievementsModal open={showAchievements} onClose={closeOverlay} />

<ReplayModal open={showReplays} onClose={closeOverlay} />

<NewGameWizard
  open={showWizard}
  onClose={() => (showWizard = false)}
  onStartMode={(m) => pickMode(m)}
  onStartLevel={(id) => pickLevel(id)}
  onStartSeed={(seed, raw) => startCustomSeed(seed, raw)}
/>

<ModeHint open={modeHint !== null} mode={modeHint} onClose={() => (modeHint = null)} />

<LevelPicker
  open={showLevelPicker}
  onClose={closeOverlay}
  onPick={pickLevel}
/>

<DonateModal open={showDonate} onClose={closeOverlay} />

<PauseOverlay
  onResume={() => game.unpause()}
  onNew={() => {
    game.unpause();
    showWizard = true;
  }}
/>

<Modal
  open={showSurrenderConfirm}
  title="Partie beenden?"
  onClose={() => (showSurrenderConfirm = false)}
>
  <p>
    Die laufende Partie wird sofort als beendet gewertet. Dein Punktestand zaehlt zur Statistik
    und wird als Replay gespeichert.
  </p>
  {#snippet footer()}
    <button class="ghost" onclick={() => (showSurrenderConfirm = false)}>Abbrechen</button>
    <button
      class="primary danger"
      onclick={() => {
        showSurrenderConfirm = false;
        game.surrender();
      }}
    >
      <i class="fa-solid fa-flag"></i>
      Beenden
    </button>
  {/snippet}
</Modal>

<style>
  :global(html, body) {
    background: var(--bg);
  }

  :global(#app) {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    position: relative;
    z-index: 1;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: color-mix(in srgb, var(--surface) 85%, transparent);
    backdrop-filter: blur(14px) saturate(1.2);
    -webkit-backdrop-filter: blur(14px) saturate(1.2);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 16px;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .title i {
    color: var(--accent);
  }

  .streak {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.18), rgba(239, 68, 68, 0.18));
    border: 1px solid rgba(251, 146, 60, 0.4);
    color: #f97316;
    font-size: 13px;
    font-weight: 700;
  }

  .streak i {
    color: #f97316;
    animation: streak-flicker 2s ease-in-out infinite;
  }

  @keyframes streak-flicker {
    0%,
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.08);
      filter: brightness(1.15);
    }
  }

  .actions {
    display: flex;
    gap: 2px;
  }

  .actions button {
    padding: 7px 9px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
  }

  .actions button:hover:not(:disabled) {
    background: var(--surface-strong);
    border-color: var(--border);
  }

  .donate-btn i {
    color: #ff4d6d;
    animation: heart-pulse 2.4s ease-in-out infinite;
    text-shadow: 0 0 8px rgba(255, 77, 109, 0.35);
  }

  .donate-btn:hover i {
    color: #ff2e57;
    text-shadow: 0 0 14px rgba(255, 77, 109, 0.8);
    animation-duration: 0.9s;
  }

  @keyframes heart-pulse {
    0%, 100% {
      transform: scale(1);
    }
    25% {
      transform: scale(1.18);
    }
    50% {
      transform: scale(0.96);
    }
    75% {
      transform: scale(1.08);
    }
  }


  main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
    width: min(560px, 100%);
    margin: 0 auto;
  }

  main.home {
    grid-template-columns: 1fr;
    width: 100%;
    padding: 0;
    place-items: start center;
  }

  .side {
    display: none;
  }

  .center {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .board-wrap {
    display: flex;
    justify-content: center;
  }

  .hint {
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  @media (min-width: 1100px) {
    main {
      grid-template-columns: 280px minmax(420px, 560px) 280px;
      gap: 24px;
      width: min(1180px, 100%);
      align-items: start;
    }

    .side {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 76px;
    }
  }
</style>
