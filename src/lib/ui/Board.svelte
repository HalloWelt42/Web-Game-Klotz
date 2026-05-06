<script lang="ts">
  import { canPlace, previewClearedLines } from '../game/board';
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import { obstacleKey, type SpecialKind } from '../game/types';
  import { pieceById } from '../game/pieces';
  import Cell from './Cell.svelte';

  type Props = {
    boardElement?: (el: HTMLDivElement | null) => void;
  };

  let { boardElement }: Props = $props();

  let boardEl = $state<HTMLDivElement | null>(null);
  let kbCursor = $state<{ x: number; y: number; slot: 0 | 1 | 2 } | null>(null);

  $effect(() => {
    boardElement?.(boardEl);
  });

  const drag = $derived(game.drag);
  const gameState = $derived(game.state);
  const size = $derived(gameState.boardSize);

  const SPECIAL_PIECE_ID: Record<SpecialKind, string> = {
    bomb: 'SP_BOMB',
    hammer: 'SP_HAMMER',
    joker: 'SP_JOKER',
  };

  let specialHover = $state<{ x: number; y: number } | null>(null);

  const previewBoard = $derived.by(() => {
    if (game.pendingSpecial && specialHover) {
      const piece = pieceById(SPECIAL_PIECE_ID[game.pendingSpecial]);
      if (piece) return computePreview(piece, specialHover.x, specialHover.y);
    }
    if (drag.active && drag.hover) {
      const slot = gameState.pool[drag.slotIndex];
      if (!slot || slot.consumed) return null;
      return computePreview(slot.piece, drag.hover.x, drag.hover.y);
    }
    if (kbCursor) {
      const slot = gameState.pool[kbCursor.slot];
      if (!slot || slot.consumed) return null;
      return computePreview(slot.piece, kbCursor.x, kbCursor.y);
    }
    return null;
  });

  function computePreview(piece: typeof gameState.pool[0]['piece'], x: number, y: number) {
    const ok = canPlace(gameState.board, piece, x, y, gameState.obstacles);
    const cleared = ok
      ? previewClearedLines(gameState.board, piece, x, y, gameState.obstacles)
      : { rows: [], cols: [] };
    const cellSet = new Set<string>();
    if (piece.kind === 'bomb') {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && py >= 0 && px < size && py < size) cellSet.add(`${px},${py}`);
        }
    } else if (piece.kind === 'hammer' || piece.kind === 'joker') {
      cellSet.add(`${x},${y}`);
    } else {
      for (const [dx, dy] of piece.cells) {
        cellSet.add(`${x + dx},${y + dy}`);
      }
    }
    return { ok, cleared, cellSet, color: piece.colorToken };
  }

  function pattern(): string | null {
    return settings.value.colorblind ? 'dots' : null;
  }

  function obstacleAt(x: number, y: number) {
    return gameState.obstacles[obstacleKey(x, y)] ?? null;
  }

  function handleCellPointer(event: PointerEvent, x: number, y: number) {
    if (!game.pendingSpecial) return;
    if (gameState.status !== 'running') return;
    event.stopPropagation();
    game.useSpecialAt(x, y);
  }

  function handleCellMove(x: number, y: number) {
    if (!game.pendingSpecial) return;
    specialHover = { x, y };
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (gameState.status !== 'running') return;
    if (event.key === 'Escape' && game.pendingSpecial) {
      event.preventDefault();
      game.selectSpecial(null);
      specialHover = null;
      return;
    }
    const slotIdx = (kbCursor?.slot ?? findFirstUnconsumedSlot()) as 0 | 1 | 2 | -1;
    if (slotIdx < 0) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      const idx = ((slotIdx + (event.shiftKey ? 2 : 1)) % 3) as 0 | 1 | 2;
      const next = nextValidCursor(idx);
      kbCursor = next;
      return;
    }

    if (!kbCursor) {
      if (
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();
        const next = nextValidCursor(slotIdx as 0 | 1 | 2);
        kbCursor = next;
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      kbCursor = { ...kbCursor, y: Math.max(0, kbCursor.y - 1) };
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      kbCursor = { ...kbCursor, y: Math.min(size - 1, kbCursor.y + 1) };
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      kbCursor = { ...kbCursor, x: Math.max(0, kbCursor.x - 1) };
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      kbCursor = { ...kbCursor, x: Math.min(size - 1, kbCursor.x + 1) };
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const result = game.commitPlace(kbCursor.slot, kbCursor.x, kbCursor.y);
      if (result.placed) {
        const newSlot = nextValidSlot(kbCursor.slot);
        kbCursor = newSlot !== null ? { slot: newSlot, x: kbCursor.x, y: kbCursor.y } : null;
      }
    } else if (event.key === 'Escape') {
      kbCursor = null;
    } else if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      game.performRotate(kbCursor.slot);
    }
  }

  function findFirstUnconsumedSlot(): 0 | 1 | 2 | -1 {
    for (let i = 0; i < 3; i++) {
      if (!gameState.pool[i].consumed) return i as 0 | 1 | 2;
    }
    return -1;
  }

  function nextValidSlot(start: 0 | 1 | 2): 0 | 1 | 2 | null {
    for (let off = 1; off <= 3; off++) {
      const i = ((start + off) % 3) as 0 | 1 | 2;
      if (!gameState.pool[i].consumed) return i;
    }
    return null;
  }

  function nextValidCursor(start: 0 | 1 | 2): { x: number; y: number; slot: 0 | 1 | 2 } | null {
    if (!gameState.pool[start].consumed) {
      return { slot: start, x: Math.floor(size / 2), y: Math.floor(size / 2) };
    }
    const next = nextValidSlot(start);
    if (next === null) return null;
    return { slot: next, x: Math.floor(size / 2), y: Math.floor(size / 2) };
  }

  $effect(() => {
    if (gameState.pool.every((p) => p.consumed)) kbCursor = null;
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
  class="board"
  class:special-mode={game.pendingSpecial !== null}
  bind:this={boardEl}
  role="grid"
  aria-label={`Spielbrett ${size} mal ${size}`}
  aria-rowcount={size}
  aria-colcount={size}
  tabindex="-1"
  style:--cols={size}
  style:--rows={size}
  onpointerdown={(e) => {
    if (!game.pendingSpecial) return;
    const t = e.target as HTMLElement;
    if (!t.classList.contains('cell')) return;
    const x = parseInt(t.dataset.x ?? '', 10);
    const y = parseInt(t.dataset.y ?? '', 10);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    handleCellPointer(e, x, y);
  }}
  onpointermove={(e) => {
    if (!game.pendingSpecial) return;
    const t = e.target as HTMLElement;
    if (!t.classList.contains('cell')) return;
    const x = parseInt(t.dataset.x ?? '', 10);
    const y = parseInt(t.dataset.y ?? '', 10);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    handleCellMove(x, y);
  }}
  onpointerleave={() => {
    if (game.pendingSpecial) specialHover = null;
  }}
>
  {#each Array(size) as _row, y}
    {#each Array(size) as _col, x}
      {@const cellColor = gameState.board[y][x]}
      {@const filled = cellColor !== null}
      {@const previewKey = `${x},${y}`}
      {@const isPreviewCell = previewBoard?.cellSet.has(previewKey) ?? false}
      {@const isClearHint =
        previewBoard?.ok &&
        (previewBoard.cleared.rows.includes(y) || previewBoard.cleared.cols.includes(x))}
      {@const obs = obstacleAt(x, y)}
      <Cell
        {x}
        {y}
        filled={filled || Boolean(previewBoard?.ok && isPreviewCell && !obs)}
        color={filled ? cellColor : isPreviewCell ? previewBoard?.color ?? null : null}
        preview={isPreviewCell && !obs ? (previewBoard?.ok ? 'ok' : 'bad') : null}
        clearHint={Boolean(isClearHint)}
        obstacle={obs}
        pattern={pattern()}
        focused={kbCursor !== null && kbCursor.x === x && kbCursor.y === y}
      />
    {/each}
  {/each}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    gap: var(--gap-cell);
    background: var(--board-bg);
    padding: 10px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    aspect-ratio: 1;
    width: 100%;
    max-width: min(92vw, 480px);
    margin: 0 auto;
    touch-action: none;
    user-select: none;
  }

  .board.special-mode {
    cursor: crosshair;
    box-shadow: 0 0 0 3px var(--accent);
  }
</style>
