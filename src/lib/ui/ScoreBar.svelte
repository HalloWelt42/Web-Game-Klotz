<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { MODES } from '../game/modes';

  const score = $derived(game.state.score);
  const combo = $derived(game.state.combo);
  const highscore = $derived(game.highscore);
  const mode = $derived(game.state.mode);
  const goal = $derived(game.state.goal);
  const timeLeft = $derived(game.state.timeLeft);
  const movesLeft = $derived(
    goal?.moves !== undefined ? Math.max(0, goal.moves - game.state.movesCount) : null,
  );

  let displayedScore = $state(0);
  let bumping = $state(false);

  const SCORE_DURATION = 600;

  $effect(() => {
    const target = score;
    if (target === displayedScore) return;
    const from = displayedScore;
    const start = performance.now();
    let cancelled = false;
    const handle = window.setInterval(() => {
      if (cancelled) return;
      const t = Math.min(1, (performance.now() - start) / SCORE_DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      displayedScore = Math.round(from + (target - from) * eased);
      if (t >= 1) {
        displayedScore = target;
        window.clearInterval(handle);
      }
    }, 16);
    if (target > from) {
      bumping = true;
      const tHandle = window.setTimeout(() => (bumping = false), 280);
      return () => {
        cancelled = true;
        window.clearInterval(handle);
        window.clearTimeout(tHandle);
      };
    }
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  });

  const goalProgress = $derived.by(() => {
    if (!goal) return null;
    if (goal.points !== undefined) {
      return { label: 'Punkte', current: game.state.score, target: goal.points };
    }
    if (goal.clears !== undefined) {
      return {
        label: 'Linien',
        current: game.state.rowsCleared + game.state.colsCleared,
        target: goal.clears,
      };
    }
    if (goal.rows !== undefined) {
      return { label: 'Reihen', current: game.state.rowsCleared, target: goal.rows };
    }
    if (goal.cols !== undefined) {
      return { label: 'Spalten', current: game.state.colsCleared, target: goal.cols };
    }
    return null;
  });

  function fmtTime(sec: number | undefined): string {
    if (sec === undefined) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
</script>

<div class="bar" role="status" aria-live="polite">
  <div class="block">
    <span class="label">{MODES[mode].label}</span>
    <span class="value primary" class:bumping>{displayedScore}</span>
  </div>
  <div class="block">
    <span class="label">Bestwert</span>
    <span class="value">{highscore}</span>
  </div>
  <div class="block combo" class:active={combo > 0}>
    <span class="label">Combo</span>
    <span class="value">{combo > 0 ? `x${combo}` : '-'}</span>
  </div>
  {#if timeLeft !== undefined}
    <div class="block extra">
      <span class="label">Zeit</span>
      <span class="value">{fmtTime(timeLeft)}</span>
    </div>
  {/if}
  {#if movesLeft !== null}
    <div class="block extra">
      <span class="label">Zuege</span>
      <span class="value">{movesLeft}</span>
    </div>
  {/if}
  {#if goalProgress}
    {@const pct = Math.min(1, goalProgress.target > 0 ? goalProgress.current / goalProgress.target : 0)}
    <div class="block extra goal">
      <span class="label">Ziel ({goalProgress.label})</span>
      <div class="ring" style:--pct={`${pct * 100}%`}>
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle class="ring-bg" cx="18" cy="18" r="15.5"></circle>
          <circle
            class="ring-fg"
            cx="18"
            cy="18"
            r="15.5"
            stroke-dasharray={`${(pct * 2 * Math.PI * 15.5).toFixed(2)} ${(2 * Math.PI * 15.5).toFixed(2)}`}
            transform="rotate(-90 18 18)"
          ></circle>
        </svg>
        <span class="ring-text">
          <span class="cur">{goalProgress.current}</span>
          <span class="div">/</span>
          <span class="tgt">{goalProgress.target}</span>
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  .bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .block.extra {
    grid-column: span 1;
  }

  .block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .value.primary {
    color: var(--accent);
    transition: transform var(--transition-fast);
  }

  .value.primary.bumping {
    animation: score-bump 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes score-bump {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.18);
    }
  }

  .combo.active .value {
    color: var(--success);
  }

  .ring {
    position: relative;
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
  }

  .ring svg {
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
    transition: stroke-dasharray 0.4s ease-out;
  }

  .ring-text {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }

  .ring-text .cur {
    color: var(--accent);
  }

  .ring-text .div {
    color: var(--text-muted);
    margin: 0 1px;
  }
</style>
