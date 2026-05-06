<script lang="ts">
  import { LEVELS } from '../game/levels';
  import { stats } from '../stores/stats.svelte';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (levelId: string) => void;
  };

  let { open, onClose, onPick }: Props = $props();

  const completed = $derived(new Set(stats.value.completedLevels));

  function starsFor(id: string): number {
    return stats.value.levelStars[id] ?? 0;
  }
</script>

<Modal {open} title="Level waehlen" {onClose}>
  <div class="meta">
    <strong>{stats.value.completedLevels.length}</strong> von {LEVELS.length} abgeschlossen
  </div>
  <ul class="list">
    {#each LEVELS as level, i (level.id)}
      {@const done = completed.has(level.id)}
      {@const prevDone = i === 0 || completed.has(LEVELS[i - 1].id)}
      {@const locked = !done && !prevDone}
      <li class:done class:locked>
        <button
          type="button"
          disabled={locked}
          onclick={() => {
            onPick(level.id);
            onClose();
          }}
        >
          <div class="num">{i + 1}</div>
          <div class="texts">
            <h4>{level.title}</h4>
            <p>{level.description}</p>
          </div>
          <div class="end">
            {#if done}
              {@const stars = starsFor(level.id)}
              <div class="stars" aria-label={`${stars} von 3 Sternen`}>
                {#each [1, 2, 3] as n}
                  <i
                    class={`fa-solid fa-star ${n <= stars ? 'filled' : 'empty'}`}
                    aria-hidden="true"
                  ></i>
                {/each}
              </div>
            {:else if locked}
              <i class="fa-solid fa-lock status lock"></i>
            {:else}
              <i class="fa-solid fa-play status play"></i>
            {/if}
          </div>
        </button>
      </li>
    {/each}
  </ul>
</Modal>

<style>
  .meta {
    margin-bottom: 14px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .meta strong {
    color: var(--accent);
    font-size: 18px;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  li {
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  li button {
    display: grid;
    grid-template-columns: 36px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    width: 100%;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    cursor: pointer;
  }

  li button:hover:not(:disabled) {
    background: var(--surface-strong);
  }

  li.done button {
    border-color: var(--success);
  }

  li.locked button {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .num {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--surface-strong);
    font-weight: 700;
    color: var(--accent);
  }

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--text-muted);
  }

  .status {
    font-size: 16px;
  }

  .lock {
    color: var(--text-muted);
  }

  .play {
    color: var(--accent);
  }

  .end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 64px;
  }

  .stars {
    display: flex;
    gap: 2px;
    font-size: 13px;
  }

  .stars .filled {
    color: #f59e0b;
    text-shadow: 0 0 4px rgba(245, 158, 11, 0.45);
  }

  .stars .empty {
    color: var(--border);
  }
</style>
