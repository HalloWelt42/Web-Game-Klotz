<script lang="ts">
  import type { ObstacleKind } from '../game/types';

  type Props = {
    x: number;
    y: number;
    filled: boolean;
    color?: string | null;
    preview?: 'ok' | 'bad' | null;
    clearHint?: boolean;
    obstacle?: ObstacleKind | null;
    pattern?: string | null;
    focused?: boolean;
  };

  let {
    x,
    y,
    filled,
    color = null,
    preview = null,
    clearHint = false,
    obstacle = null,
    pattern = null,
    focused = false,
  }: Props = $props();
</script>

<div
  class="cell"
  class:filled
  class:clearHint
  class:preview-ok={preview === 'ok'}
  class:preview-bad={preview === 'bad'}
  class:obstacle-block={obstacle === 'block'}
  class:obstacle-ice={obstacle === 'ice'}
  class:focused
  style:--cell-fill={filled && color ? `var(${color})` : 'transparent'}
  data-x={x}
  data-y={y}
  data-pattern={pattern}
>
  {#if obstacle === 'block'}
    <i class="fa-solid fa-lock obs-icon"></i>
  {:else if obstacle === 'ice'}
    <i class="fa-solid fa-snowflake obs-icon"></i>
  {/if}
</div>

<style>
  .cell {
    width: 100%;
    aspect-ratio: 1;
    background: var(--cell-empty);
    border: 1px solid var(--cell-empty-edge);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast), transform var(--transition-fast);
    position: relative;
    display: grid;
    place-items: center;
  }

  .cell.filled {
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--cell-fill) 88%, white 12%) 0%,
      var(--cell-fill) 35%,
      color-mix(in srgb, var(--cell-fill) 72%, black 28%) 78%,
      color-mix(in srgb, var(--cell-fill) 48%, black 52%) 100%
    );
    border-color: color-mix(in srgb, var(--cell-fill) 40%, black 60%);
    box-shadow:
      inset 0 -4px 0 color-mix(in srgb, var(--cell-fill) 38%, black 62%),
      inset 0 2.5px 0 color-mix(in srgb, var(--cell-fill) 50%, white 50%),
      inset 0 0 0 1px color-mix(in srgb, var(--cell-fill) 55%, black 45%),
      0 2px 3px rgba(0, 0, 0, 0.4),
      0 0 calc(16px * var(--piece-glow-strength, 0)) var(--cell-fill);
  }

  .cell.filled::before {
    content: '';
    position: absolute;
    inset: 10% auto auto 10%;
    width: 38%;
    height: 22%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    border-radius: 50%;
    pointer-events: none;
    filter: blur(0.5px);
  }

  .cell.preview-ok {
    background: var(--cell-preview-ok);
    border-color: var(--accent);
  }

  .cell.preview-bad {
    background: var(--cell-preview-bad);
    border-color: var(--danger);
  }

  .cell.clearHint::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--cell-clear-hint);
    border-radius: inherit;
    pointer-events: none;
    animation: pulse 0.6s ease-out;
  }

  .cell.obstacle-block {
    background: repeating-linear-gradient(
      45deg,
      var(--text-muted) 0,
      var(--text-muted) 4px,
      var(--surface-strong) 4px,
      var(--surface-strong) 8px
    );
    border-color: var(--text-muted);
  }

  .cell.obstacle-ice {
    background: linear-gradient(135deg, #93c5fd 0%, #bfdbfe 100%);
    border-color: #60a5fa;
    color: #1e40af;
  }

  .cell.focused {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .obs-icon {
    font-size: 0.55em;
    color: rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }

  .cell.filled[data-pattern='dots']::after {
    content: '';
    position: absolute;
    inset: 18%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.45);
  }

  @keyframes pulse {
    0% {
      opacity: 0.85;
    }
    100% {
      opacity: 0;
    }
  }
</style>
