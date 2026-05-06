<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { stats } from '../stores/stats.svelte';
  import { router } from '../router.svelte';
  import { canUndo } from '../game/engine';

  type Props = {
    onNewGame: () => void;
    onSurrender: () => void;
    onOpenAchievements: () => void;
    onOpenReplays: () => void;
    onOpenStats: () => void;
    onOpenDonate: () => void;
    onOpenSettings: () => void;
  };

  let {
    onNewGame,
    onSurrender,
    onOpenAchievements,
    onOpenReplays,
    onOpenStats,
    onOpenDonate,
    onOpenSettings,
  }: Props = $props();

  const isHome = $derived(router.route.kind === 'home');
  const isGame = $derived.by(() => {
    const k = router.route.kind;
    return k === 'mode' || k === 'level' || k === 'seed' || k === 'replay';
  });
</script>

<header class="topbar">
  <button
    type="button"
    class="brand"
    aria-label="Hauptmenü"
    onclick={() => router.navigate({ kind: 'home' })}
  >
    <i class="fa-solid fa-cubes"></i>
    <span class="title">Klotz</span>
    {#if stats.dailyStreak > 0}
      <span
        class="streak"
        title={`Daily-Streak: ${stats.dailyStreak} Tag${stats.dailyStreak === 1 ? '' : 'e'}`}
      >
        <i class="fa-solid fa-fire"></i>
        <span>{stats.dailyStreak}</span>
      </span>
    {/if}
  </button>

  <div class="actions">
    {#if isGame}
      <button
        class="ghost"
        title="Letzten Zug rückgängig"
        aria-label="Letzten Zug rückgängig"
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
        onclick={onSurrender}
      >
        <i class="fa-solid fa-flag"></i>
      </button>
    {/if}

    <button
      class="ghost new-game"
      title="Neue Partie"
      aria-label="Neue Partie"
      onclick={onNewGame}
    >
      <i class="fa-solid fa-shapes"></i>
    </button>

    {#if !isHome}
      <button class="ghost" title="Erfolge" aria-label="Erfolge" onclick={onOpenAchievements}>
        <i class="fa-solid fa-trophy"></i>
      </button>
      <button class="ghost" title="Replays" aria-label="Replays" onclick={onOpenReplays}>
        <i class="fa-solid fa-share-nodes"></i>
      </button>
      <button class="ghost" title="Statistik" aria-label="Statistik" onclick={onOpenStats}>
        <i class="fa-solid fa-chart-simple"></i>
      </button>
      <button
        class="ghost donate-btn"
        title="Danke sagen"
        aria-label="Danke sagen"
        onclick={onOpenDonate}
      >
        <i class="fa-solid fa-heart"></i>
      </button>
      <button class="ghost" title="Einstellungen" aria-label="Einstellungen" onclick={onOpenSettings}>
        <i class="fa-solid fa-gear"></i>
      </button>
    {/if}
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 14px;
    background: color-mix(in srgb, var(--surface) 85%, transparent);
    backdrop-filter: blur(14px) saturate(1.2);
    -webkit-backdrop-filter: blur(14px) saturate(1.2);
    border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    color: var(--text);
    font-family: inherit;
    transition: background var(--transition-fast);
  }

  .brand:hover {
    background: var(--surface-strong);
  }

  .brand i {
    color: var(--accent);
    font-size: 18px;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.02em;
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
    font-size: 12px;
    font-weight: 700;
  }

  .streak i {
    color: #f97316;
    font-size: 11px;
    animation: streak-flicker 2s ease-in-out infinite;
  }

  @keyframes streak-flicker {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
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
  }

  @keyframes heart-pulse {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.18); }
    50% { transform: scale(0.96); }
    75% { transform: scale(1.08); }
  }
</style>
