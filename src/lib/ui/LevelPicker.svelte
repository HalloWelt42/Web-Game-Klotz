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
    position: relative;
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    width: 100%;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    cursor: pointer;
    overflow: hidden;
    transition: transform var(--transition-fast), border-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  li button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(99, 102, 241, 0.12) 0%, transparent 60%);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast);
  }

  li button:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--accent);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  }

  li button:hover:not(:disabled)::before {
    opacity: 1;
  }

  li.done button {
    border-color: rgba(34, 197, 94, 0.45);
    background: linear-gradient(120deg, rgba(34, 197, 94, 0.1) 0%, var(--surface) 50%);
  }

  li.locked button {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .num {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    font-weight: 800;
    font-size: 18px;
    color: white;
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  }

  li.done .num {
    background: linear-gradient(135deg, #facc15, #f59e0b);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
    color: #4a2306;
  }

  li.locked .num {
    background: var(--surface-strong);
    color: var(--text-muted);
    box-shadow: none;
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
    gap: 3px;
    font-size: 16px;
  }

  .stars .filled {
    color: #f59e0b;
    text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
    animation: star-glow 2.4s ease-in-out infinite;
  }

  .stars .filled:nth-child(2) {
    animation-delay: 0.2s;
  }

  .stars .filled:nth-child(3) {
    animation-delay: 0.4s;
  }

  .stars .empty {
    color: var(--border);
  }

  @keyframes star-glow {
    0%, 100% {
      filter: brightness(1);
      transform: scale(1);
    }
    50% {
      filter: brightness(1.25);
      transform: scale(1.12);
    }
  }
</style>
