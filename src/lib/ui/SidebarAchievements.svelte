<script lang="ts">
  import { ACHIEVEMENTS } from '../game/achievements';
  import { stats } from '../stores/stats.svelte';
  import { router } from '../router.svelte';

  const unlocked = $derived(new Set(stats.value.achievements));
  const recent = $derived.by(() => {
    const all = [...ACHIEVEMENTS];
    const got = all.filter((a) => unlocked.has(a.id));
    const open = all.filter((a) => !unlocked.has(a.id));
    return [...got.slice(-3).reverse(), ...open.slice(0, Math.max(0, 6 - got.slice(-3).length))];
  });
</script>

<aside class="sidebar">
  <header>
    <h3>Erfolge</h3>
    <span class="count">{unlocked.size}/{ACHIEVEMENTS.length}</span>
  </header>
  <ul>
    {#each recent as a (a.id)}
      {@const got = unlocked.has(a.id)}
      <li class:got data-tier={a.tier}>
        <div class={`icon tier-${a.tier}`} class:got>
          <i class={`fa-solid ${a.icon}`}></i>
        </div>
        <div class="meta">
          <strong>{a.title}</strong>
          <small>{a.description}</small>
        </div>
        {#if got}
          <i class="fa-solid fa-check check" aria-hidden="true"></i>
        {/if}
      </li>
    {/each}
  </ul>
  <button class="ghost more" onclick={() => router.navigate({ kind: 'achievements' })}>
    Alle Erfolge
    <i class="fa-solid fa-arrow-right"></i>
  </button>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    width: 100%;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    margin: 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .count {
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  li {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    opacity: 0.55;
  }

  li.got {
    opacity: 1;
    border-color: rgba(34, 197, 94, 0.35);
  }

  .icon {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 13px;
    background: var(--surface);
    color: var(--text-muted);
  }

  li.got .icon.tier-bronze {
    background: linear-gradient(135deg, #e8a07a, #b87333);
    color: #3d1206;
  }

  li.got .icon.tier-silver {
    background: linear-gradient(135deg, #f1f5f9, #94a3b8);
    color: #0f172a;
  }

  li.got .icon.tier-gold {
    background: linear-gradient(135deg, #fef3c7, #f59e0b);
    color: #4a2305;
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  strong {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .check {
    color: var(--success);
    font-size: 12px;
  }

  .more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    font-size: 12px;
  }
</style>
