<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { stats } from '../stores/stats.svelte';
  import { router } from '../router.svelte';
  import { MODES } from '../game/modes';

  type Props = {
    onStartNew: () => void;
  };

  let { onStartNew }: Props = $props();

  const hasResume = $derived(game.resumePrompt !== null);
  const lastMode = $derived(game.state.mode);
</script>

<section class="menu">
  <div class="hero">
    <div class="logo">
      <i class="fa-solid fa-cubes"></i>
    </div>
    <h1>Klotz</h1>
    <p>Block-Puzzle-Spiel im 1010!-Stil. Lokal, offline, ohne Tracker.</p>
  </div>

  <div class="big-actions">
    {#if hasResume}
      <button
        type="button"
        class="big primary"
        onclick={() => {
          game.resume();
          router.navigate({ kind: 'mode', mode: lastMode });
        }}
      >
        <i class="fa-solid fa-play"></i>
        <span class="label">Partie fortsetzen</span>
        <span class="sub">Punkte: {game.resumePrompt?.score ?? 0}</span>
      </button>
    {/if}
    <button type="button" class="big primary" onclick={onStartNew}>
      <i class="fa-solid fa-shapes"></i>
      <span class="label">Neue Partie</span>
      <span class="sub">Modus, Brettgröße und Optionen wählen</span>
    </button>
  </div>

  <div class="quick-modes" aria-label="Schnellstart">
    <span class="qm-label">Schnellstart</span>
    <button
      type="button"
      class="qm-button"
      onclick={() => router.navigate({ kind: 'mode', mode: 'endless' })}
    >
      <i class={`fa-solid ${MODES.endless.icon}`}></i>
      Endless
    </button>
    <button
      type="button"
      class="qm-button"
      onclick={() => router.navigate({ kind: 'mode', mode: 'daily' })}
    >
      <i class={`fa-solid ${MODES.daily.icon}`}></i>
      Tages-Challenge
    </button>
    <button
      type="button"
      class="qm-button"
      onclick={() => router.navigate({ kind: 'levels' })}
    >
      <i class={`fa-solid ${MODES.level.icon}`}></i>
      Levels
    </button>
  </div>

  <dl class="snapshot">
    <div>
      <dt>Spiele</dt>
      <dd>{stats.value.gamesPlayed}</dd>
    </div>
    <div>
      <dt>Erfolge</dt>
      <dd>{stats.value.achievements.length}</dd>
    </div>
    <div>
      <dt>Bestwert Endless</dt>
      <dd>{stats.value.perGameHigh.endless ?? 0}</dd>
    </div>
    <div>
      <dt>Linien gesamt</dt>
      <dd>{stats.value.rowsCleared + stats.value.colsCleared}</dd>
    </div>
  </dl>

  <div class="links">
    <button class="link" type="button" onclick={() => router.navigate({ kind: 'achievements' })}>
      <i class="fa-solid fa-trophy"></i>
      Erfolge
    </button>
    <button class="link" type="button" onclick={() => router.navigate({ kind: 'stats' })}>
      <i class="fa-solid fa-chart-simple"></i>
      Statistik
    </button>
    <button class="link" type="button" onclick={() => router.navigate({ kind: 'replays' })}>
      <i class="fa-solid fa-share-nodes"></i>
      Replays
    </button>
    <button class="link" type="button" onclick={() => router.navigate({ kind: 'settings' })}>
      <i class="fa-solid fa-gear"></i>
      Einstellungen
    </button>
    <button class="link" type="button" onclick={() => router.navigate({ kind: 'help' })}>
      <i class="fa-solid fa-circle-question"></i>
      Anleitung
    </button>
    <button class="link donate" type="button" onclick={() => router.navigate({ kind: 'donate' })}>
      <i class="fa-solid fa-heart"></i>
      Danke sagen
    </button>
  </div>
</section>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    padding: 32px 16px 48px;
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .logo {
    width: 96px;
    height: 96px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    border-radius: 28px;
    color: white;
    font-size: 44px;
    box-shadow: 0 12px 32px color-mix(in srgb, var(--accent) 50%, transparent),
      inset 0 -4px 0 rgba(0, 0, 0, 0.18),
      inset 0 2px 0 rgba(255, 255, 255, 0.3);
    transform: rotate(-4deg);
  }

  h1 {
    margin: 0;
    font-size: 42px;
    font-weight: 900;
    letter-spacing: 0.04em;
    color: var(--text);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .hero p {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
    max-width: 380px;
  }

  .big-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .big {
    display: grid;
    grid-template-columns: 44px 1fr;
    grid-template-rows: auto auto;
    column-gap: 14px;
    align-items: center;
    padding: 14px 18px;
    border-radius: var(--radius-md);
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    border: 1px solid var(--accent-strong);
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    color: white;
    box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 40%, transparent);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .big:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px color-mix(in srgb, var(--accent) 50%, transparent);
  }

  .big i {
    grid-row: span 2;
    font-size: 22px;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
  }

  .big .label {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.01em;
  }

  .big .sub {
    font-size: 12px;
    opacity: 0.85;
  }

  .quick-modes {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    width: 100%;
    padding: 10px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .qm-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    font-weight: 700;
    margin-right: 4px;
  }

  .qm-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .qm-button:hover {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  }

  .qm-button i {
    color: var(--accent);
    font-size: 12px;
  }

  .snapshot {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    width: 100%;
    margin: 0;
  }

  .snapshot > div {
    padding: 10px 14px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .snapshot dt {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .snapshot dd {
    margin: 4px 0 0;
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
  }

  .link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .link:hover {
    border-color: var(--accent);
    background: var(--surface-strong);
  }

  .link i {
    color: var(--accent);
    font-size: 18px;
  }

  .link.donate i {
    color: #ff4d6d;
  }
</style>
