<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { MODES } from '../game/modes';
  import { router, withBase } from '../router.svelte';
  import Modal from './Modal.svelte';

  const COUNTDOWN_SECONDS = 5;
  const RING_RADIUS = 15.5;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const open = $derived(
    !game.gameEndDismissed &&
      (game.state.status === 'gameover' || game.state.status === 'won'),
  );
  const won = $derived(game.state.status === 'won');

  let copied = $state(false);
  let secondsLeft = $state(COUNTDOWN_SECONDS);
  let paused = $state(false);
  let timerHandle: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (open) {
      startCountdown();
    } else {
      stopCountdown();
    }
    return () => stopCountdown();
  });

  function startCountdown() {
    stopCountdown();
    secondsLeft = COUNTDOWN_SECONDS;
    paused = false;
    timerHandle = setInterval(() => {
      if (paused) return;
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        backToMenu();
      }
    }, 1000);
  }

  function stopCountdown() {
    if (timerHandle !== null) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function backToMenu() {
    stopCountdown();
    game.dismissGameEnd();
    router.navigate({ kind: 'home' });
  }

  function restart() {
    stopCountdown();
    void game.startNew(game.state.mode);
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
    // Während des Teilens den Auto-Timer anhalten -- der Nutzer
    // soll nicht mitten in der Aktion ins Menü geworfen werden.
    paused = true;
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

  const dashLength = $derived(
    Math.max(0, (secondsLeft / COUNTDOWN_SECONDS) * RING_CIRCUMFERENCE),
  );
</script>

<Modal {open} title={won ? 'Geschafft!' : 'Vorbei!'} onClose={backToMenu} closeOnBackdrop={false}>
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
        <dt>Längste Combo</dt>
        <dd>{game.state.streak}</dd>
      </div>
      <div>
        <dt>Züge</dt>
        <dd>{game.state.movesCount}</dd>
      </div>
    </dl>
  </div>
  {#snippet footer()}
    <div class="footer-row">
      <div
        class="countdown"
        class:paused
        aria-live="polite"
        aria-label={paused ? 'Auto-Timer angehalten' : `Automatisch zurück zum Menü in ${secondsLeft} Sekunden`}
      >
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle class="ring-bg" cx="18" cy="18" r={RING_RADIUS}></circle>
          <circle
            class="ring-fg"
            cx="18"
            cy="18"
            r={RING_RADIUS}
            stroke-dasharray={`${dashLength} ${RING_CIRCUMFERENCE}`}
            transform="rotate(-90 18 18)"
          ></circle>
        </svg>
        <span class="countdown-num">{paused ? '--' : secondsLeft}</span>
      </div>
      <div class="actions">
        <button class="ghost" onclick={backToMenu}>
          <i class="fa-solid fa-house"></i>
          Hauptmenü
        </button>
        <button class="ghost" onclick={shareReplay}>
          <i class="fa-solid fa-share-nodes"></i>
          {copied ? 'Kopiert!' : 'Replay teilen'}
        </button>
        <button class="primary" onclick={restart}>
          <i class="fa-solid fa-rotate-right"></i>
          Neue Partie
        </button>
      </div>
    </div>
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

  .footer-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .countdown {
    position: relative;
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
  }

  .countdown svg {
    width: 100%;
    height: 100%;
  }

  .ring-bg {
    fill: none;
    stroke: var(--border);
    stroke-width: 3;
  }

  .ring-fg {
    fill: none;
    stroke: var(--accent);
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 1s linear;
  }

  .countdown.paused .ring-fg {
    stroke: var(--text-muted);
    transition: none;
  }

  .countdown-num {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 800;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  .countdown.paused .countdown-num {
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
    flex-wrap: wrap;
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

  @media (max-width: 480px) {
    .actions {
      gap: 6px;
    }
    .actions button {
      padding: 8px 10px;
      font-size: 12px;
    }
  }
</style>
