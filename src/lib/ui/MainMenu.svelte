<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { stats } from '../stores/stats.svelte';
  import { router } from '../router.svelte';
  import { MODES } from '../game/modes';
  import type { GameMode } from '../game/types';

  type Props = {
    onStartNew: () => void;
  };

  let { onStartNew }: Props = $props();

  const hasResume = $derived(game.resumePrompt !== null);
  const lastMode = $derived(game.state.mode);

  const modeOrder: GameMode[] = ['endless', 'daily', 'level', 'timed', 'reverse', 'shrink'];
</script>

<section class="menu">
  <header class="brand">
    <div class="logo" aria-hidden="true">
      <i class="fa-solid fa-cubes"></i>
    </div>
    <h1>Klotz</h1>
    <p class="claim">Block-Puzzle. Lokal, offline, ohne Tracker.</p>
  </header>

  <div class="primary-actions">
    {#if hasResume}
      <button
        type="button"
        class="cta resume"
        onclick={() => {
          game.resume();
          router.navigate({ kind: 'mode', mode: lastMode });
        }}
      >
        <span class="cta-icon"><i class="fa-solid fa-play"></i></span>
        <span class="cta-body">
          <strong>Weiterspielen</strong>
          <small>{game.resumePrompt?.score ?? 0} Punkte, {MODES[lastMode].label}</small>
        </span>
      </button>
    {/if}
    <button type="button" class="cta start" class:secondary={hasResume} onclick={onStartNew}>
      <span class="cta-icon"><i class="fa-solid fa-shapes"></i></span>
      <span class="cta-body">
        <strong>Neue Partie</strong>
        <small>Modus, Brettgröße und Optionen wählen</small>
      </span>
    </button>
  </div>

  <section class="modes" aria-label="Spielmodi">
    <h2>Modi</h2>
    <div class="mode-grid">
      {#each modeOrder as id}
        {@const cfg = MODES[id]}
        <button
          type="button"
          class={`mode-tile mode-${id}`}
          onclick={() => {
            if (id === 'level') router.navigate({ kind: 'levels' });
            else router.navigate({ kind: 'mode', mode: id });
          }}
          aria-label={cfg.label}
        >
          <i class={`fa-solid ${cfg.icon}`}></i>
          <span>{cfg.label}</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="snapshot" aria-label="Übersicht">
    <h2>Übersicht</h2>
    <dl>
      <div>
        <dt>Spiele</dt>
        <dd>{stats.value.gamesPlayed}</dd>
      </div>
      <div>
        <dt>Erfolge</dt>
        <dd>{stats.value.achievements.length}</dd>
      </div>
      <div>
        <dt>Beste Endless</dt>
        <dd>{stats.value.perGameHigh.endless ?? 0}</dd>
      </div>
      <div>
        <dt>Geräumte Linien</dt>
        <dd>{stats.value.rowsCleared + stats.value.colsCleared}</dd>
      </div>
    </dl>
  </section>

  <nav class="more" aria-label="Mehr">
    <button class="more-link" type="button" onclick={() => router.navigate({ kind: 'achievements' })}>
      <i class="fa-solid fa-trophy"></i>
      <span>Erfolge</span>
    </button>
    <button class="more-link" type="button" onclick={() => router.navigate({ kind: 'stats' })}>
      <i class="fa-solid fa-chart-simple"></i>
      <span>Statistik</span>
    </button>
    <button class="more-link" type="button" onclick={() => router.navigate({ kind: 'replays' })}>
      <i class="fa-solid fa-share-nodes"></i>
      <span>Replays</span>
    </button>
    <button class="more-link" type="button" onclick={() => router.navigate({ kind: 'settings' })}>
      <i class="fa-solid fa-gear"></i>
      <span>Einstellungen</span>
    </button>
    <button class="more-link" type="button" onclick={() => router.navigate({ kind: 'help' })}>
      <i class="fa-solid fa-circle-question"></i>
      <span>Anleitung</span>
    </button>
    <button class="more-link donate" type="button" onclick={() => router.navigate({ kind: 'donate' })}>
      <i class="fa-solid fa-heart"></i>
      <span>Danke sagen</span>
    </button>
  </nav>
</section>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 28px 16px 56px;
    width: 100%;
    max-width: 540px;
    margin: 0 auto;
  }

  .brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .logo {
    width: 88px;
    height: 88px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    border-radius: 24px;
    color: white;
    font-size: 38px;
    box-shadow: 0 14px 32px color-mix(in srgb, var(--accent) 45%, transparent),
      inset 0 -3px 0 rgba(0, 0, 0, 0.18),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
    transform: rotate(-3deg);
    margin-bottom: 6px;
  }

  h1 {
    margin: 0;
    font-size: 38px;
    font-weight: 900;
    letter-spacing: 0.04em;
    color: var(--text);
  }

  .claim {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .primary-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cta {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 14px;
    align-items: center;
    padding: 16px 18px;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .cta:hover {
    transform: translateY(-2px);
  }

  .cta.resume {
    background: linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 70%, black 30%));
    color: white;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--success) 40%, transparent);
  }

  .cta.start {
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    color: white;
    box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 40%, transparent);
  }

  .cta.secondary {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    box-shadow: none;
  }

  .cta.secondary .cta-icon {
    background: var(--surface-strong);
    color: var(--accent);
  }

  .cta-icon {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.18);
    border-radius: 50%;
    font-size: 22px;
  }

  .cta-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cta-body strong {
    font-size: 17px;
    font-weight: 800;
  }

  .cta-body small {
    font-size: 12px;
    opacity: 0.9;
  }

  .modes h2,
  .snapshot h2 {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }

  .mode-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .mode-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    transition: transform var(--transition-fast), border-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .mode-tile:hover {
    transform: translateY(-2px);
    border-color: var(--mode-color, var(--accent));
    box-shadow: 0 6px 18px color-mix(in srgb, var(--mode-color, var(--accent)) 25%, transparent);
  }

  .mode-tile i {
    font-size: 22px;
    color: var(--mode-color, var(--accent));
  }

  .mode-tile.mode-endless { --mode-color: #6366f1; }
  .mode-tile.mode-daily { --mode-color: #f59e0b; }
  .mode-tile.mode-level { --mode-color: #22c55e; }
  .mode-tile.mode-timed { --mode-color: #ef4444; }
  .mode-tile.mode-reverse { --mode-color: #a855f7; }
  .mode-tile.mode-shrink { --mode-color: #14b8a6; }

  .snapshot dl {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin: 0;
  }

  .snapshot dl > div {
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .snapshot dt {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .snapshot dd {
    margin: 4px 0 0;
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .more {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .more-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .more-link:hover {
    border-color: var(--accent);
    background: var(--surface-strong);
  }

  .more-link i {
    color: var(--accent);
    font-size: 16px;
  }

  .more-link.donate i {
    color: #ff4d6d;
  }
</style>
