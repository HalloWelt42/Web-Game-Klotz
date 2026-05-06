<script lang="ts">
  import { game } from '../stores/game.svelte';
  import { settings } from '../stores/settings.svelte';
  import Piece from './Piece.svelte';

  type Props = {
    cellSize: number;
    gap: number;
  };

  let { cellSize, gap }: Props = $props();

  const drag = $derived(game.drag);
  const slot = $derived.by(() => {
    if (!drag.active) return null;
    return game.state.pool[drag.slotIndex] ?? null;
  });

  const x = $derived(drag.active ? drag.pointer.x - (drag.anchor.x + 0.5) * (cellSize + gap) : 0);
  const y = $derived(drag.active ? drag.pointer.y - (drag.anchor.y + 0.5) * (cellSize + gap) : 0);
</script>

{#if drag.active && slot}
  <div class="ghost" style:left={`${x}px`} style:top={`${y}px`}>
    <Piece
      piece={slot.piece}
      {cellSize}
      {gap}
      pattern={settings.value.colorblind ? 'dots' : null}
    />
  </div>
{/if}

<style>
  .ghost {
    position: fixed;
    pointer-events: none;
    z-index: 90;
    transform: translate3d(0, 0, 0);
    opacity: 0.92;
    filter: drop-shadow(var(--shadow-md));
    transition: opacity var(--transition-fast);
  }
</style>
