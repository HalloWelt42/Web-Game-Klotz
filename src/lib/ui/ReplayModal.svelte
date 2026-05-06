<script lang="ts">
  import { onMount } from 'svelte';
  import { loadReplays } from '../game/persistence';
  import { MODES } from '../game/modes';
  import type { Replay } from '../game/types';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
  };

  let { open, onClose }: Props = $props();
  let replays = $state<Replay[]>([]);
  let copied = $state<string | null>(null);

  $effect(() => {
    if (open) {
      void loadReplays().then((r) => (replays = r));
    }
  });

  function makeUrl(r: Replay): string {
    const moves = r.moves
      .map((m) => `${m.slot}:${m.pieceId}:${m.x}:${m.y}`)
      .join(',');
    return `${window.location.origin}/replay/${r.mode}/${r.seed}/${encodeURIComponent(moves)}`;
  }

  async function copyUrl(r: Replay) {
    const url = makeUrl(r);
    try {
      await navigator.clipboard.writeText(url);
      copied = `${r.seed}-${r.moves.length}`;
      setTimeout(() => {
        if (copied === `${r.seed}-${r.moves.length}`) copied = null;
      }, 2000);
    } catch {
      copied = 'failed';
    }
  }
</script>

<Modal {open} title="Replays" {onClose}>
  {#if replays.length === 0}
    <p class="empty">Noch keine Replays. Spiele eine Partie zu Ende, um eine zu speichern.</p>
  {:else}
    <ul>
      {#each replays as r, i (i)}
        <li>
          <div class="meta">
            <strong>{MODES[r.mode].label}</strong>
            <span class="moves">{r.moves.length} Zuege</span>
          </div>
          <button class="ghost" onclick={() => copyUrl(r)}>
            <i class="fa-solid fa-link"></i>
            {copied === `${r.seed}-${r.moves.length}`
              ? 'Kopiert!'
              : copied === 'failed'
              ? 'Fehler'
              : 'Link kopieren'}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Modal>

<style>
  .empty {
    color: var(--text-muted);
    margin: 0;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .moves {
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
