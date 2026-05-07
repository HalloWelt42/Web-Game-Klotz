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
  import Topbar from './lib/ui/Topbar.svelte';
  import DragGhost from './lib/ui/DragGhost.svelte';
  import ToastStack from './lib/ui/ToastStack.svelte';
  import FxOverlay from './lib/ui/FxOverlay.svelte';
  import SoundLab from './lib/ui/SoundLab.svelte';
  import type { GameMode } from './lib/game/types';
  import { newFromReplay } from './lib/game/engine';
  import type { Replay } from './lib/game/types';
  import { router, routeToPath } from './lib/router.svelte';

  const TUTORIAL_KEY = 'klotz:tutorial-shown';

  let boardEl = $state<HTMLDivElement | null>(null);
  let cellSize = $state(36);
  const cellGap = 4;

  let modeHint = $state<GameMode | null>(null);
  let showLevelPicker = $state(false);
  let showSurrenderConfirm = $state(false);

  let initialised = $state(false);

  async function applyRouteAction() {
    const r = router.route;
    if (r.kind === 'mode') {
      // Bereits laufende Partie im selben Modus mit gleicher Brettgröße
      // nicht überschreiben. Wichtig: Vergleich mit der TATSÄCHLICHEN
      // Größe der laufenden Partie, nicht mit den Settings -- sonst
      // würde ein Größenwechsel still verschluckt.
      const sizeOk = !r.size || game.state.boardSize === r.size;
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
    showLevelPicker = r.kind === 'levels';
    if (initialised && r.kind === 'new-game') {
      // Wenn aus dem Neue-Partie-Menü ein Spiel gestartet wird,
      // navigiert pickMode/pickLevel weiter -- hier nichts tun
    }
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
      r.kind === 'donate' ||
      r.kind === 'new-game'
    ) {
      // Wenn eine Partie läuft, zurück zum Brett
      // Sonst zurück zum Hauptmenü
      if (game.state.status === 'running' && game.state.movesCount > 0) {
        router.navigate({ kind: 'mode', mode: game.state.mode });
      } else {
        router.navigate({ kind: 'home' });
      }
    }
  }

  function openOverlay(
    kind: 'stats' | 'achievements' | 'replays' | 'settings' | 'levels' | 'donate' | 'new-game',
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

  function openNewGame() {
    router.navigate({ kind: 'new-game' });
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
    const r = router.route;
    if (
      showLevelPicker ||
      showSurrenderConfirm ||
      r.kind === 'new-game' ||
      r.kind === 'stats' ||
      r.kind === 'achievements' ||
      r.kind === 'replays' ||
      r.kind === 'settings' ||
      r.kind === 'donate' ||
      r.kind === 'help'
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

<svelte:window onkeydown={handleGlobalKey} />

{#if router.route.kind === 'sound-lab'}
  <SoundLab />
{:else}
<Topbar
  onNewGame={openNewGame}
  onSurrender={() => (showSurrenderConfirm = true)}
/>

<main
  class:home={router.route.kind === 'home'}
  class:page={router.route.kind === 'stats' ||
    router.route.kind === 'achievements' ||
    router.route.kind === 'replays' ||
    router.route.kind === 'settings' ||
    router.route.kind === 'donate' ||
    router.route.kind === 'help' ||
    router.route.kind === 'new-game'}
>
  {#if router.route.kind === 'home'}
    <MainMenu onStartNew={openNewGame} />
  {:else if router.route.kind === 'new-game'}
    <NewGameWizard
      open={true}
      inline
      onClose={closeOverlay}
      onStartMode={(m) => pickMode(m)}
      onStartLevel={(id) => pickLevel(id)}
      onStartSeed={(seed, raw) => startCustomSeed(seed, raw)}
    />
  {:else if router.route.kind === 'stats'}
    <StatsModal open inline onClose={closeOverlay} />
  {:else if router.route.kind === 'achievements'}
    <AchievementsModal open inline onClose={closeOverlay} />
  {:else if router.route.kind === 'replays'}
    <ReplayModal open inline onClose={closeOverlay} />
  {:else if router.route.kind === 'settings'}
    <SettingsModal open inline onClose={closeOverlay} onShowTutorial={showTutorialAgain} />
  {:else if router.route.kind === 'donate'}
    <DonateModal open inline onClose={closeOverlay} />
  {:else if router.route.kind === 'help'}
    <TutorialOverlay open inline onClose={closeTutorial} />
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

<ModeHint open={modeHint !== null} mode={modeHint} onClose={() => (modeHint = null)} />

<LevelPicker
  open={showLevelPicker}
  onClose={closeOverlay}
  onPick={pickLevel}
/>

<PauseOverlay
  onResume={() => game.unpause()}
  onNew={() => {
    game.unpause();
    openNewGame();
  }}
/>

<Modal
  open={showSurrenderConfirm}
  title="Partie beenden?"
  onClose={() => (showSurrenderConfirm = false)}
>
  <p>
    Die laufende Partie wird sofort als beendet gewertet. Dein Punktestand zählt zur Statistik
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
{/if}

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

  /* Page-Routes (stats, achievements, replays, settings, donate, help,
     new-game) sind einspaltige Inhalte. Sie duerfen nicht ins
     3-Spalten-Spiel-Grid fallen, sonst landet der Inhalt in der
     schmalen Sidebar-Spalte. */
  main.page {
    grid-template-columns: 1fr;
    width: min(720px, 100%);
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

  @media (min-width: 1100px) {
    /* 3-Spalten nur fuer das Spielbrett, nicht fuer Home oder Page. */
    main:not(.home):not(.page) {
      grid-template-columns: 280px minmax(420px, 560px) 280px;
      gap: 24px;
      width: min(1180px, 100%);
      align-items: start;
    }

    main:not(.home):not(.page) .side {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 76px;
    }
  }
</style>
