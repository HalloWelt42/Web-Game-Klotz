<script lang="ts">
  import type { Piece } from '../game/types';

  type Props = {
    piece: Piece;
    cellSize?: number;
    gap?: number;
    fitSize?: number | null;
    dim?: boolean;
    pattern?: string | null;
  };

  let {
    piece,
    cellSize: cellSizeIn = 28,
    gap = 4,
    fitSize = null,
    dim = false,
    pattern = null,
  }: Props = $props();

  const cellSize = $derived.by(() => {
    if (fitSize === null) return cellSizeIn;
    const dim = Math.max(piece.width, piece.height);
    const totalGap = (dim - 1) * gap;
    return Math.max(6, Math.floor((fitSize - totalGap) / dim));
  });

  const filledSet = $derived.by(() => {
    const s = new Set<string>();
    for (const [x, y] of piece.cells) s.add(`${x},${y}`);
    return s;
  });

  function specialIcon(): string | null {
    if (piece.kind === 'bomb') return 'fa-bomb';
    if (piece.kind === 'hammer') return 'fa-hammer';
    if (piece.kind === 'joker') return 'fa-wand-magic-sparkles';
    return null;
  }
</script>

<div
  class="piece"
  class:dim
  class:special={piece.kind !== 'standard'}
  style:--cs={`${cellSize}px`}
  style:--gp={`${gap}px`}
  style:width={`${piece.width * cellSize + (piece.width - 1) * gap}px`}
  style:height={`${piece.height * cellSize + (piece.height - 1) * gap}px`}
>
  {#each Array(piece.height) as _row, y}
    {#each Array(piece.width) as _col, x}
      {#if filledSet.has(`${x},${y}`)}
        <div
          class="block"
          class:special={piece.kind !== 'standard'}
          style:left={`${x * (cellSize + gap)}px`}
          style:top={`${y * (cellSize + gap)}px`}
          style:--bg={`var(${piece.colorToken})`}
          data-pattern={pattern}
        >
          {#if specialIcon()}
            <i class={`fa-solid ${specialIcon()}`} aria-hidden="true"></i>
          {/if}
        </div>
      {/if}
    {/each}
  {/each}
</div>

<style>
  .piece {
    position: relative;
  }

  .piece.dim {
    opacity: 0.32;
    filter: grayscale(0.4);
  }

  .block {
    position: absolute;
    width: var(--cs);
    height: var(--cs);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--bg) 88%, white 12%) 0%,
      var(--bg) 35%,
      color-mix(in srgb, var(--bg) 72%, black 28%) 78%,
      color-mix(in srgb, var(--bg) 48%, black 52%) 100%
    );
    border-radius: var(--radius-sm);
    box-shadow:
      inset 0 -4px 0 color-mix(in srgb, var(--bg) 38%, black 62%),
      inset 0 2.5px 0 color-mix(in srgb, var(--bg) 50%, white 50%),
      inset 0 0 0 1px color-mix(in srgb, var(--bg) 55%, black 45%),
      0 3px 5px rgba(0, 0, 0, 0.4),
      0 0 calc(18px * var(--piece-glow-strength, 0)) var(--bg);
    display: grid;
    place-items: center;
  }

  .block::before {
    content: '';
    position: absolute;
    inset: 10% auto auto 10%;
    width: 38%;
    height: 22%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.75) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    border-radius: 50%;
    pointer-events: none;
    filter: blur(0.5px);
  }

  .block.special {
    background: linear-gradient(135deg, #f97316, #ec4899, #6366f1);
    background-size: 200% 200%;
    animation: gradientShift 3s ease infinite;
  }

  .block i {
    color: white;
    font-size: calc(var(--cs) * 0.55);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  }

  .block[data-pattern='dots']::after {
    content: '';
    position: absolute;
    inset: 18%;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.45);
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
