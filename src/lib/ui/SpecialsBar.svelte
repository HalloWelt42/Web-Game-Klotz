<script lang="ts">
  import { game } from '../stores/game.svelte';
  import type { SpecialKind } from '../game/types';

  type Item = { kind: SpecialKind; icon: string; label: string };
  const items: Item[] = [
    { kind: 'bomb', icon: 'fa-bomb', label: 'Bombe' },
    { kind: 'hammer', icon: 'fa-hammer', label: 'Hammer' },
    { kind: 'joker', icon: 'fa-wand-magic-sparkles', label: 'Joker' },
  ];

  function toggle(kind: SpecialKind) {
    if (game.pendingSpecial === kind) {
      game.selectSpecial(null);
    } else {
      game.selectSpecial(kind);
    }
  }

  let earnedFlash = $state<{ kind: SpecialKind; id: number; ts: number } | null>(null);

  $effect(() => {
    const recent = game.fx
      .filter((f) => f.kind === 'special-earned')
      .sort((a, b) => b.at - a.at)[0];
    if (!recent) return;
    if (earnedFlash?.id === recent.id) return;
    const kind = recent.payload as SpecialKind;
    earnedFlash = { kind, id: recent.id, ts: recent.at };
    const t = setTimeout(() => {
      if (earnedFlash?.id === recent.id) earnedFlash = null;
    }, 900);
    return () => clearTimeout(t);
  });

  // Wenn der Spezial direkt nach dem Verdienen wieder verbraucht ist,
  // soll das Flash-Highlight sofort verschwinden.
  $effect(() => {
    if (!earnedFlash) return;
    if (game.state.specials[earnedFlash.kind] <= 0) {
      earnedFlash = null;
    }
  });
</script>

<div class="bar" aria-label="Power-Ups">
  {#each items as item}
    {@const count = game.state.specials[item.kind] ?? 0}
    {@const flashing = earnedFlash?.kind === item.kind && count > 0}
    <button
      type="button"
      class="slot"
      class:available={count > 0}
      class:active={game.pendingSpecial === item.kind && count > 0}
      class:flashing
      data-kind={item.kind}
      disabled={count === 0}
      onclick={() => toggle(item.kind)}
      aria-label={`${item.label} -- ${count} verfügbar`}
    >
      <div class="icon-wrap">
        <i class={`fa-solid ${item.icon}`}></i>
        {#if flashing}
          <span class="earned-pop" aria-hidden="true">+1</span>
        {/if}
      </div>
      <span class="count">{count}</span>
    </button>
  {/each}
</div>

{#if game.pendingSpecial}
  <div class="hint" role="status" aria-live="polite">
    <i class="fa-solid fa-crosshairs"></i>
    <span>
      Zelle anklicken, um {game.pendingSpecial === 'bomb'
        ? 'Bombe (3x3 leeren)'
        : game.pendingSpecial === 'hammer'
        ? 'Hammer (1 Zelle)'
        : 'Joker (1 freie Zelle)'} zu nutzen. Esc bricht ab.
    </span>
  </div>
{/if}

<style>
  .bar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .slot {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    cursor: not-allowed;
    overflow: visible;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast),
      border-color var(--transition-fast), background var(--transition-fast);
  }

  .slot.available {
    cursor: pointer;
    color: var(--text);
  }

  .slot.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
    background: color-mix(in srgb, var(--accent) 12%, var(--surface-strong));
  }

  .slot.flashing {
    animation: slot-bounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-color: var(--success);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.35);
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), transparent);
  }

  .icon-wrap {
    position: relative;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
  }

  .slot i {
    color: var(--accent);
    font-size: 24px;
    line-height: 1;
  }

  .slot:not(.available) i {
    color: var(--text-muted);
  }

  .slot.flashing i {
    color: var(--success);
    animation: icon-pulse 0.7s ease-out;
  }

  .earned-pop {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    color: var(--success);
    font-weight: 700;
    font-size: 14px;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    animation: earned-pop 0.9s ease-out forwards;
    pointer-events: none;
  }

  .count {
    font-size: 18px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    min-width: 1.2em;
    text-align: left;
  }

  .slot:not(.available) .count {
    color: var(--text-muted);
    opacity: 0.5;
  }

  .hint {
    margin-top: 10px;
    padding: 10px 14px;
    background: var(--surface-strong);
    border: 1px solid var(--accent);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.18);
  }

  .hint i {
    color: var(--accent);
  }

  @keyframes slot-bounce {
    0% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.12);
    }
    60% {
      transform: scale(0.96);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes icon-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.4) rotate(-8deg);
    }
  }

  @keyframes earned-pop {
    0% {
      transform: translate(-50%, 6px) scale(0.6);
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -28px) scale(1.1);
      opacity: 0;
    }
  }

</style>
