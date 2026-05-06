<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import Piece from './Piece.svelte';

  type Props = {
    onPickup: (event: {
      slotIndex: 0 | 1 | 2;
      pointer: { x: number; y: number };
      anchor: { x: number; y: number };
      pointerId: number;
      element: HTMLElement;
    }) => void;
  };

  let { onPickup }: Props = $props();

  function patternFor(_id: string): string | null {
    return settings.value.colorblind ? 'dots' : null;
  }

  function handlePointerDown(event: PointerEvent, slotIndex: 0 | 1 | 2) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const slot = game.state.pool[slotIndex];
    if (!slot || slot.consumed) return;
    if (game.state.status !== 'running') return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const anchorX = (event.clientX - rect.left) / rect.width;
    const anchorY = (event.clientY - rect.top) / rect.height;
    const ax = Math.min(slot.piece.width - 1, Math.max(0, Math.floor(anchorX * slot.piece.width)));
    const ay = Math.min(
      slot.piece.height - 1,
      Math.max(0, Math.floor(anchorY * slot.piece.height)),
    );
    onPickup({
      slotIndex,
      pointer: { x: event.clientX, y: event.clientY },
      anchor: { x: ax, y: ay },
      pointerId: event.pointerId,
      element: target,
    });
    event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent, slotIndex: 0 | 1 | 2) {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      game.performSkip(slotIndex);
    }
  }

  const slots = $derived(game.state.pool);
</script>

<div class="pool" aria-label="Verfügbare Steine">
  {#each slots as slot, i}
    {@const slotIndex = i as 0 | 1 | 2}
    <button
      type="button"
      class="slot"
      class:dim={slot.consumed}
      disabled={slot.consumed}
      onpointerdown={(e) => handlePointerDown(e, slotIndex)}
      onkeydown={(e) => handleKeyDown(e, slotIndex)}
      aria-label={slot.consumed
        ? 'Stein bereits gelegt'
        : `Stein ${slot.piece.id} aufnehmen`}
    >
      {#if !slot.consumed}
        <Piece
          piece={slot.piece}
          fitSize={70}
          gap={3}
          pattern={patternFor(slot.piece.id)}
          dim={game.drag.active && game.drag.slotIndex === slotIndex}
        />
      {:else}
        <div class="placeholder">
          <i class="fa-solid fa-check"></i>
        </div>
      {/if}
    </button>
  {/each}
</div>

<style>
  .pool {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 12px;
    background: var(--surface-strong);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
  }

  .slot {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    aspect-ratio: 1;
    min-width: 0;
    display: grid;
    place-items: center;
    padding: 8px;
    touch-action: none;
    user-select: none;
    cursor: grab;
    transition: transform var(--transition-fast), background var(--transition-fast);
    overflow: hidden;
  }

  .slot:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .slot.dim {
    cursor: default;
    background: var(--surface-strong);
  }

  .slot:active:not(.dim) {
    transform: scale(0.97);
    cursor: grabbing;
  }

  .placeholder {
    color: var(--success);
    font-size: 22px;
  }
</style>
