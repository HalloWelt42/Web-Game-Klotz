<script lang="ts">
  import { ACHIEVEMENTS } from '../game/achievements';
  import { stats } from '../stores/stats.svelte';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    inline?: boolean;
  };

  let { open, onClose, inline = false }: Props = $props();

  const unlockedSet = $derived(new Set(stats.value.achievements));
</script>

<Modal {open} title="Erfolge" {onClose} {inline}>
  <div class="meta">
    <strong>{stats.value.achievements.length}</strong> von {ACHIEVEMENTS.length} freigeschaltet
  </div>
  <ul class="list">
    {#each ACHIEVEMENTS as a (a.id)}
      {@const got = unlockedSet.has(a.id)}
      <li class:got data-tier={a.tier}>
        <div class={`icon tier-${a.tier}`}>
          <i class={`fa-solid ${a.icon}`}></i>
        </div>
        <div class="texts">
          <h4>{a.title}</h4>
          <p>{a.description}</p>
          <span class={`tier-label tier-${a.tier}`}>{a.tier === 'bronze' ? 'Bronze' : a.tier === 'silver' ? 'Silber' : 'Gold'}</span>
        </div>
        {#if got}
          <i class="fa-solid fa-check check" aria-label="erreicht"></i>
        {:else}
          <i class="fa-solid fa-lock lock" aria-label="noch nicht"></i>
        {/if}
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
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    opacity: 0.55;
  }

  li.got {
    opacity: 1;
    border-color: var(--accent);
  }

  .icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--surface);
    color: var(--text-muted);
    font-size: 18px;
  }

  li.got .icon.tier-bronze {
    background: linear-gradient(135deg, #fde68a, #d97706);
    color: #4a2406;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.55);
  }

  li.got .icon.tier-silver {
    background: linear-gradient(135deg, #f1f5f9, #94a3b8);
    color: #0f172a;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
  }

  li.got .icon.tier-gold {
    background: linear-gradient(135deg, #fef3c7, #f59e0b);
    color: #4a2305;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.55);
  }

  li:not(.got) .icon {
    background: var(--surface);
    color: var(--text-muted);
  }

  .tier-label {
    display: inline-block;
    margin-top: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tier-label.tier-bronze {
    background: rgba(217, 119, 6, 0.18);
    color: #d97706;
  }

  .tier-label.tier-silver {
    background: rgba(148, 163, 184, 0.18);
    color: #64748b;
  }

  .tier-label.tier-gold {
    background: rgba(245, 158, 11, 0.18);
    color: #b45309;
  }

  h4 {
    margin: 0;
    font-size: 14px;
  }

  p {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--text-muted);
  }

  .check {
    color: var(--success);
  }

  .lock {
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
