<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { router } from '../router.svelte';

  type Props = {
    onResume: () => void;
    onNew: () => void;
  };

  let { onResume, onNew }: Props = $props();

  function home() {
    router.navigate({ kind: 'home' });
  }
</script>

{#if game.paused && game.state.status === 'running'}
  <div class="overlay" role="dialog" aria-modal="true" aria-label="Pause">
    <div class="card">
      <div class="badge">
        <i class="fa-solid fa-pause"></i>
      </div>
      <h2>Pause</h2>
      <p>Atme durch. Das Spiel wartet auf dich.</p>

      <div class="meta">
        <div>
          <span class="lbl">Punkte</span>
          <strong>{game.state.score}</strong>
        </div>
        <div>
          <span class="lbl">Zuege</span>
          <strong>{game.state.movesCount}</strong>
        </div>
        <div>
          <span class="lbl">Combo</span>
          <strong>x{game.state.combo}</strong>
        </div>
      </div>

      <div class="actions">
        <button class="primary" type="button" onclick={onResume}>
          <i class="fa-solid fa-play"></i>
          Weiter
        </button>
        <button class="ghost" type="button" onclick={onNew}>
          <i class="fa-solid fa-shapes"></i>
          Neue Partie
        </button>
        <button class="ghost" type="button" onclick={() => game.surrender()}>
          <i class="fa-solid fa-flag"></i>
          Partie beenden
        </button>
        <button class="ghost" type="button" onclick={home}>
          <i class="fa-solid fa-house"></i>
          Hauptansicht
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: blur(10px) saturate(1.1);
    -webkit-backdrop-filter: blur(10px) saturate(1.1);
    display: grid;
    place-items: center;
    padding: 24px;
    z-index: 90;
    animation: pause-fade 0.2s ease-out;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg), 0 0 60px rgba(99, 102, 241, 0.18);
    padding: 28px 32px;
    text-align: center;
    max-width: 380px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    animation: pause-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .badge {
    width: 76px;
    height: 76px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    color: white;
    border-radius: 50%;
    font-size: 32px;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
  }

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--text);
  }

  p {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
    margin-top: 4px;
  }

  .meta > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 8px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .lbl {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .meta strong {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    margin-top: 8px;
  }

  .actions button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 700;
  }

  @keyframes pause-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pause-pop {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
