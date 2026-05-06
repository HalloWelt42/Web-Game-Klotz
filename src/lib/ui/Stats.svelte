<script lang="ts">
  import { stats } from '../stores/stats.svelte';
  import { ACHIEVEMENTS } from '../game/achievements';
  import { MODES } from '../game/modes';
  import { DEFAULT_BOARD_SIZE } from '../game/types';
  import type { GameMode } from '../game/types';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
  };

  let { open, onClose }: Props = $props();

  const heatMax = $derived.by(() => {
    let m = 0;
    for (const row of stats.value.heatmap) for (const v of row) if (v > m) m = v;
    return m || 1;
  });

  const last7Daily = $derived.by(() => stats.value.dailyScores.slice(0, 7));

  const last30 = $derived.by(() => stats.value.dailyScores.slice(0, 30));

  const weeklyTotal = $derived.by(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    return stats.value.dailyScores
      .filter((d) => new Date(d.date).getTime() >= weekAgo)
      .reduce((sum, d) => sum + d.score, 0);
  });

  function weekKey(date: Date): string {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - onejan.getTime()) / (24 * 3600 * 1000));
    const week = Math.ceil((days + onejan.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  const weekly = $derived.by(() => {
    const map = new Map<string, { week: string; total: number; count: number }>();
    for (const d of stats.value.dailyScores) {
      const wk = weekKey(new Date(d.date));
      const existing = map.get(wk);
      if (existing) {
        existing.total += d.score;
        existing.count += 1;
      } else {
        map.set(wk, { week: wk, total: d.score, count: 1 });
      }
    }
    const arr = [...map.values()].sort((a, b) => (a.week > b.week ? -1 : 1));
    return arr.slice(0, 8).map((w, i, all) => {
      const prev = all[i + 1];
      const trend = prev ? Math.sign(w.total - prev.total) : 0;
      return { ...w, trend };
    });
  });

  function modeOrder(): GameMode[] {
    return ['endless', 'daily', 'level', 'timed', 'reverse', 'shrink'];
  }
</script>

<Modal {open} title="Statistik" {onClose}>
  <div class="stats">
    <dl>
      <div>
        <dt>Spiele</dt>
        <dd>{stats.value.gamesPlayed}</dd>
      </div>
      <div>
        <dt>Gesamtpunkte</dt>
        <dd>{stats.value.totalPoints}</dd>
      </div>
      <div>
        <dt>Hoechste Combo</dt>
        <dd>{stats.value.highestCombo}</dd>
      </div>
      <div>
        <dt>Laengste Streak</dt>
        <dd>{stats.value.longestStreak}</dd>
      </div>
      <div>
        <dt>Reihen geraumt</dt>
        <dd>{stats.value.rowsCleared}</dd>
      </div>
      <div>
        <dt>Spalten geraumt</dt>
        <dd>{stats.value.colsCleared}</dd>
      </div>
      <div>
        <dt>Erfolge</dt>
        <dd>{stats.value.achievements.length} / {ACHIEVEMENTS.length}</dd>
      </div>
      <div>
        <dt>7-Tage-Punkte</dt>
        <dd>{weeklyTotal}</dd>
      </div>
    </dl>

    <section>
      <h3>Bestwerte je Modus</h3>
      <div class="modes">
        {#each modeOrder() as m}
          <div class="mode-row">
            <i class={`fa-solid ${MODES[m].icon}`}></i>
            <span class="m-label">{MODES[m].label}</span>
            <span class="m-score">{stats.value.perGameHigh[m] ?? 0}</span>
          </div>
        {/each}
      </div>
    </section>

    {#if last7Daily.length > 0}
      <section>
        <h3>Tages-Challenge der letzten Tage</h3>
        <ul class="daily">
          {#each last7Daily as d}
            <li>
              <span class="d-date">{d.date}</span>
              <span class="d-score">{d.score}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if last30.length > 0}
      <section>
        <h3>30-Tage-Verlauf</h3>
        <div class="bars" aria-hidden="true">
          {#each last30 as d}
            {@const top = Math.max(...last30.map((x) => x.score), 1)}
            <div class="bar" style:height={`${Math.max(2, (d.score / top) * 100)}%`}></div>
          {/each}
        </div>
      </section>
    {/if}

    {#if weekly.length > 0}
      <section>
        <h3>Wochenliga (letzte 8 Wochen)</h3>
        <ul class="weekly">
          {#each weekly as w}
            <li>
              <span class="w-key">{w.week}</span>
              <span class="w-total">{w.total}</span>
              <span class="w-trend" class:up={w.trend > 0} class:down={w.trend < 0}>
                {#if w.trend > 0}<i class="fa-solid fa-arrow-up"></i>
                {:else if w.trend < 0}<i class="fa-solid fa-arrow-down"></i>
                {:else}<i class="fa-solid fa-minus"></i>{/if}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section>
      <h3>Heatmap der Belegungen</h3>
      <div class="heat" aria-label="Heatmap der Spielfelder">
        {#each Array(DEFAULT_BOARD_SIZE) as _row, y}
          {#each Array(DEFAULT_BOARD_SIZE) as _col, x}
            {@const v = stats.value.heatmap[y]?.[x] ?? 0}
            <div
              class="hcell"
              style:--alpha={v === 0 ? 0 : Math.max(0.1, v / heatMax)}
              title={`${x},${y}: ${v}`}
            ></div>
          {/each}
        {/each}
      </div>
    </section>
  </div>
</Modal>

<style>
  .stats {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 0;
  }

  dl > div {
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
  }

  dt {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  dd {
    margin: 4px 0 0;
    font-size: 18px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .modes {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mode-row {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .mode-row i {
    color: var(--accent);
  }

  .m-score {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .daily {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .daily li {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }

  .d-score {
    font-weight: 700;
    color: var(--accent);
  }

  .bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 80px;
    background: var(--surface-strong);
    border-radius: var(--radius-md);
    padding: 6px;
    border: 1px solid var(--border);
  }

  .bar {
    flex: 1;
    background: linear-gradient(180deg, var(--accent), var(--accent-strong));
    border-radius: 2px;
    min-height: 2px;
  }

  .weekly {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .weekly li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }

  .w-key {
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
  }

  .w-total {
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  .w-trend {
    color: var(--text-muted);
    width: 16px;
    text-align: center;
  }

  .w-trend.up {
    color: var(--success);
  }

  .w-trend.down {
    color: var(--danger);
  }

  .heat {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 2px;
    aspect-ratio: 1;
    background: var(--board-bg);
    padding: 6px;
    border-radius: var(--radius-md);
  }

  .hcell {
    aspect-ratio: 1;
    background: rgba(99, 102, 241, var(--alpha));
    border-radius: 3px;
  }
</style>
