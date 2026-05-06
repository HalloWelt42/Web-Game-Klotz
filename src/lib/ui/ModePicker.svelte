<script lang="ts">
  import { MODES } from '../game/modes';
  import { settings } from '../stores/settings.svelte';
  import type { BoardSize, GameMode } from '../game/types';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (mode: GameMode) => void;
    onCustomSeed: (seed: number, raw: string) => void;
  };

  let { open, onClose, onPick, onCustomSeed }: Props = $props();

  const order: GameMode[] = ['endless', 'daily', 'level', 'timed', 'reverse', 'shrink'];
  const sizes: BoardSize[] = [6, 8, 10, 12];

  let showCustom = $state(false);
  let seedInput = $state('');

  function pickSize(s: BoardSize) {
    void settings.update({ boardSize: s });
  }

  function isFlexible(mode: GameMode): boolean {
    return mode !== 'level';
  }

  function startCustom() {
    const trimmed = seedInput.trim();
    if (!trimmed) return;
    let seed: number;
    if (/^\d+$/.test(trimmed)) {
      seed = parseInt(trimmed, 10) >>> 0;
    } else {
      let h = 2166136261;
      for (let i = 0; i < trimmed.length; i++) {
        h ^= trimmed.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      seed = h >>> 0;
    }
    onCustomSeed(seed, trimmed);
    onClose();
  }
</script>

<Modal {open} title="Modus waehlen" {onClose}>
  <div class="size-row" role="radiogroup" aria-label="Brettgroesse">
    <span class="size-label">Brettgroesse</span>
    {#each sizes as s}
      <button
        type="button"
        class="size-pill"
        class:active={settings.value.boardSize === s}
        role="radio"
        aria-checked={settings.value.boardSize === s}
        onclick={() => pickSize(s)}
      >
        {s} x {s}
      </button>
    {/each}
  </div>

  <p class="size-hint">
    Gilt fuer Endless, Daily, Zeitrennen, Reverse und Shrink. Levels haben fixe Brettgroessen.
  </p>

  <div class="grid">
    {#each order as id}
      {@const cfg = MODES[id]}
      <button
        type="button"
        class="card"
        onclick={() => {
          onPick(id);
          onClose();
        }}
      >
        <div class="icon">
          <i class={`fa-solid ${cfg.icon}`}></i>
        </div>
        <div class="meta">
          <h3>
            {cfg.label}
            {#if isFlexible(id)}
              <span class="size-tag">{settings.value.boardSize} x {settings.value.boardSize}</span>
            {/if}
          </h3>
          <p>{cfg.description}</p>
        </div>
      </button>
    {/each}

    {#if !showCustom}
      <button type="button" class="card custom" onclick={() => (showCustom = true)}>
        <div class="icon">
          <i class="fa-solid fa-key"></i>
        </div>
        <div class="meta">
          <h3>Eigener Seed</h3>
          <p>Endless-Modus mit fixiertem Seed -- Speedrun gegen die exakt gleiche Steinfolge.</p>
        </div>
      </button>
    {:else}
      <div class="seed-form">
        <label>
          <span>Seed (Zahl oder Wort)</span>
          <input
            type="text"
            bind:value={seedInput}
            placeholder="z.B. 12345 oder 'klotz'"
            onkeydown={(e) => {
              if (e.key === 'Enter') startCustom();
            }}
          />
        </label>
        <div class="seed-actions">
          <button class="ghost" type="button" onclick={() => (showCustom = false)}>Abbrechen</button>
          <button class="primary" type="button" onclick={startCustom} disabled={!seedInput.trim()}>
            Starten
          </button>
        </div>
      </div>
    {/if}
  </div>
</Modal>

<style>
  .grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 14px;
    padding: 14px 16px;
    align-items: center;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
  }

  .card:hover {
    background: var(--surface-strong);
  }

  .card:active {
    transform: scale(0.98);
  }

  .icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    background: var(--surface-strong);
    border-radius: 50%;
    color: var(--accent);
    font-size: 22px;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .card.custom {
    border-style: dashed;
  }

  .seed-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .seed-form label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .seed-form input {
    font-family: inherit;
    background: var(--surface-strong);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
  }

  .seed-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .size-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 12px 14px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
  }

  .size-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
    margin-right: auto;
  }

  .size-pill {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }

  .size-pill:hover {
    border-color: var(--accent);
  }

  .size-pill.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent-strong);
  }

  .size-hint {
    margin: 0 0 12px;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.4;
  }

  .size-tag {
    margin-left: 8px;
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--surface-strong);
    color: var(--accent);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    vertical-align: middle;
  }
</style>
