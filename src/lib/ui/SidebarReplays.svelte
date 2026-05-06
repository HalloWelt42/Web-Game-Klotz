<script lang="ts">
  import { onMount } from 'svelte';
  import { loadReplays } from '../game/persistence';
  import { MODES } from '../game/modes';
  import { stats } from '../stores/stats.svelte';
  import { game } from '../stores/game.svelte';
  import { router } from '../router.svelte';
  import type { Replay } from '../game/types';

  let replays = $state<Replay[]>([]);

  async function refresh() {
    replays = await loadReplays();
  }

  onMount(refresh);

  $effect(() => {
    void game.state.movesCount;
    if (game.state.status !== 'running') void refresh();
  });

  const lastDays = $derived.by(() => stats.value.dailyScores.slice(0, 6));
  const streak = $derived(stats.dailyStreak);
</script>

<aside class="sidebar">
  <section>
    <header>
      <h3>Daily-Streak</h3>
      <span class="streak"><i class="fa-solid fa-fire"></i>{streak}</span>
    </header>
    {#if lastDays.length === 0}
      <p class="empty">Noch keine Tages-Challenge gespielt.</p>
    {:else}
      <ul class="days">
        {#each lastDays as d}
          <li>
            <span class="d-date">{d.date.slice(5)}</span>
            <span class="d-score">{d.score}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <header>
      <h3>Letzte Replays</h3>
      <button
        class="ghost-link"
        onclick={() => router.navigate({ kind: 'replays' })}
        aria-label="Alle Replays anzeigen"
      >
        <i class="fa-solid fa-arrow-right"></i>
      </button>
    </header>
    {#if replays.length === 0}
      <p class="empty">Noch keine Replays. Spiele eine Partie zu Ende.</p>
    {:else}
      <ul class="replay-list">
        {#each replays.slice(0, 5) as r, i (i)}
          <li>
            <i class={`fa-solid ${MODES[r.mode].icon}`}></i>
            <span class="r-mode">{MODES[r.mode].label}</span>
            <span class="r-moves">{r.moves.length} Z.</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    width: 100%;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
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

  .streak {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.18), rgba(239, 68, 68, 0.18));
    border: 1px solid rgba(251, 146, 60, 0.4);
    color: #f97316;
    font-size: 12px;
    font-weight: 700;
  }

  .streak i {
    color: #f97316;
  }

  .empty {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  ul.days li {
    display: flex;
    justify-content: space-between;
    padding: 4px 10px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 12px;
  }

  .d-score {
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  ul.replay-list li {
    display: grid;
    grid-template-columns: 18px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 12px;
  }

  ul.replay-list i {
    color: var(--accent);
    text-align: center;
  }

  .r-mode {
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .r-moves {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    font-size: 11px;
  }

  .ghost-link {
    background: transparent;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 2px 6px;
    font-size: 12px;
  }
</style>
