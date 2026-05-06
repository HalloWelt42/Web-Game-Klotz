<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { MODES } from '../game/modes';
  import { withBase } from '../router.svelte';
  import Modal from './Modal.svelte';

  const open = $derived(game.state.status === 'gameover' || game.state.status === 'won');
  const won = $derived(game.state.status === 'won');

  let copied = $state(false);

  function restart() {
    void game.startNew(game.state.mode);
  }

  function dismiss() {
    game.dismissGameEnd();
  }

  function makeUrl(): string {
    const r = game.state.replay;
    const moves = r.moves
      .map((m) => `${m.slot}:${m.pieceId}:${m.x}:${m.y}`)
      .join(',');
    const path = withBase(`/replay/${r.mode}/${r.seed}/${encodeURIComponent(moves)}`);
    return `${window.location.origin}${path}`;
  }

  async function shareReplay() {
    const url = makeUrl();
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: 'Klotz Partie',
          text: `Ich habe ${game.state.score} Punkte erreicht. Probier den Verlauf!`,
          url,
        });
        return;
      } catch {
        // Falls share abgelehnt -> Clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }
</script>

<Modal {open} title={won ? 'Geschafft!' : 'Vorbei!'} onClose={dismiss} closeOnBackdrop={false}>
  <div class="content" class:won>
    {#if won}
      <div class="trophy">
        <i class="fa-solid fa-trophy"></i>
      </div>
    {/if}
    <p>
      {won
        ? `Du hast das Ziel im Modus "${MODES[game.state.mode].label}" erreicht.`
        : 'Es passt kein Stein mehr -- die Partie ist beendet.'}
    </p>
    <dl>
      <div>
        <dt>Punkte</dt>
        <dd>{game.state.score}</dd>
      </div>
      <div>
        <dt>Bestwert</dt>
        <dd>{game.highscore}</dd>
      </div>
      <div>
        <dt>Laengste Combo</dt>
        <dd>{game.state.streak}</dd>
      </div>
      <div>
        <dt>Zuege</dt>
        <dd>{game.state.movesCount}</dd>
      </div>
    </dl>
  </div>
  {#snippet footer()}
    <button class="ghost" onclick={dismiss}>
      Schliessen
    </button>
    <button class="ghost" onclick={shareReplay}>
      <i class="fa-solid fa-share-nodes"></i>
      {copied ? 'Kopiert!' : 'Replay teilen'}
    </button>
    <button class="primary" onclick={restart}>
      <i class="fa-solid fa-rotate-right"></i>
      Neue Partie
    </button>
  {/snippet}
</Modal>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .content.won {
    align-items: center;
    text-align: center;
  }

  .trophy {
    width: 80px;
    height: 80px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #fde68a, #f59e0b);
    color: #92400e;
    font-size: 38px;
    border-radius: 50%;
    box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45);
    animation: bounceIn 0.6s ease-out;
  }

  p {
    margin: 0;
    color: var(--text-muted);
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 0;
    align-self: stretch;
  }

  dl > div {
    background: var(--surface-strong);
    padding: 10px 14px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
  }

  dt {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  dd {
    margin: 4px 0 0;
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    60% {
      transform: scale(1.15);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }
</style>
