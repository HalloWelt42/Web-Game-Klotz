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

<div class="hud" role="status" aria-live="polite">
  <div class="hud-side left">
    <div class={`combo-badge ${combo >= 5 ? 'mega' : combo > 0 ? 'on' : ''}`}>
      <span class="combo-multi">{combo > 0 ? `x${combo}` : 'x1'}</span>
      <span class="combo-label">Combo</span>
    </div>
    {#if timeLeft !== undefined}
      <div class={`chip ${timeLeft < 30 ? 'urgent' : ''}`}>
        <i class="fa-solid fa-stopwatch"></i>
        <span>{fmtTime(timeLeft)}</span>
      </div>
    {/if}
    {#if movesLeft !== null}
      <div class={`chip ${movesLeft <= 3 ? 'urgent' : ''}`}>
        <i class="fa-solid fa-shoe-prints"></i>
        <span>{movesLeft} Z.</span>
      </div>
    {/if}
  </div>

  <div class="hud-center">
    <div class="score-value" class:bumping>{displayedScore}</div>
    <div class="score-mode">{MODES[mode].label}</div>
  </div>

  <div class="hud-side right">
    <div class="chip best">
      <i class="fa-solid fa-trophy"></i>
      <span>{highscore}</span>
    </div>
    {#if goalProgress}
      {@const pct = Math.min(
        1,
        goalProgress.target > 0 ? goalProgress.current / goalProgress.target : 0,
      )}
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
    {/if}
  </div>
</div>

<style>
  .hud {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: linear-gradient(180deg, var(--surface) 0%, var(--surface-strong) 100%);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 4px 14px rgba(0, 0, 0, 0.18);
  }

  .hud-side {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .hud-side.left {
    justify-content: flex-start;
  }

  .hud-side.right {
    justify-content: flex-end;
  }

  .hud-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    min-width: 96px;
  }

  .score-value {
    font-size: 38px;
    font-weight: 900;
    line-height: 1;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    text-shadow:
      0 0 14px color-mix(in srgb, var(--accent) 40%, transparent),
      0 2px 0 rgba(0, 0, 0, 0.3);
  }

  .score-value.bumping {
    animation: score-bump 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .score-mode {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--text-muted);
    margin-top: 2px;
    font-weight: 600;
  }

  .combo-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 10px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    min-width: 56px;
    transition: all var(--transition-fast);
  }

  .combo-badge.on {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.05));
    border-color: var(--success);
    color: var(--success);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18), 0 0 14px rgba(34, 197, 94, 0.32);
  }

  .combo-badge.mega {
    background: linear-gradient(135deg, #f97316, #ec4899);
    border-color: #ec4899;
    color: white;
    box-shadow: 0 0 16px rgba(236, 72, 153, 0.55);
    animation: combo-mega 0.7s ease-in-out infinite alternate;
  }

  .combo-multi {
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .combo-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2px;
    font-weight: 600;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .chip i {
    color: var(--text-muted);
    font-size: 12px;
  }

  .chip.urgent {
    border-color: var(--danger);
    color: var(--danger);
    animation: chip-urgent 0.6s ease-in-out infinite alternate;
  }

  .chip.urgent i {
    color: var(--danger);
  }

  .chip.best i {
    color: #f59e0b;
  }

  @keyframes combo-mega {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.05);
    }
  }

  @keyframes chip-urgent {
    0% {
      box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4);
    }
    100% {
      box-shadow: 0 0 0 6px rgba(225, 29, 72, 0);
    }
  }

  @keyframes score-bump {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.16);
    }
  }

  .ring {
    position: relative;
    width: 56px;
    height: 56px;
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
