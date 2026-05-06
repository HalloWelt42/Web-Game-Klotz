<script lang="ts">
  import { MODES } from '../game/modes';
  import { LEVELS } from '../game/levels';
  import { settings } from '../stores/settings.svelte';
  import { stats } from '../stores/stats.svelte';
  import type { BoardSize, GameMode } from '../game/types';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    inline?: boolean;
    onClose: () => void;
    onStartMode: (mode: GameMode) => void;
    onStartLevel: (id: string) => void;
    onStartSeed: (seed: number, raw: string) => void;
  };

  let { open, inline = false, onClose, onStartMode, onStartLevel, onStartSeed }: Props = $props();

  type Step = 1 | 2 | 3;
  let step = $state<Step>(1);
  let mode = $state<GameMode | null>(null);
  let chosenSeed = $state<{ value: string; numeric: number } | null>(null);
  let chosenLevelId = $state<string | null>(null);
  let useCustomSeed = $state(false);
  let seedInput = $state('');

  const sizes: BoardSize[] = [6, 8, 10, 12];

  const modeOrder: GameMode[] = ['endless', 'daily', 'level', 'timed', 'reverse', 'shrink'];

  const completedLevels = $derived(new Set(stats.value.completedLevels));

  $effect(() => {
    if (open) {
      step = 1;
      mode = null;
      chosenSeed = null;
      chosenLevelId = null;
      useCustomSeed = false;
      seedInput = '';
    }
  });

  function pickMode(m: GameMode) {
    mode = m;
    chosenLevelId = null;
    chosenSeed = null;
    useCustomSeed = false;
    if (m === 'level') {
      step = 2;
    } else if (needsSize(m)) {
      step = 2;
    } else {
      step = 3;
    }
  }

  function needsSize(m: GameMode): boolean {
    return m !== 'level';
  }

  function pickSize(s: BoardSize) {
    void settings.update({ boardSize: s });
    step = 3;
  }

  function pickLevel(id: string) {
    chosenLevelId = id;
    step = 3;
  }

  function applyCustomSeed() {
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
    chosenSeed = { value: trimmed, numeric: seed };
    step = 3;
  }

  function back() {
    if (step === 3) step = mode === 'level' || (mode && needsSize(mode)) ? 2 : 1;
    else if (step === 2) step = 1;
  }

  function start() {
    if (mode === 'level' && chosenLevelId) {
      onStartLevel(chosenLevelId);
    } else if (chosenSeed) {
      onStartSeed(chosenSeed.numeric, chosenSeed.value);
    } else if (mode) {
      onStartMode(mode);
    }
    onClose();
  }

  function levelStars(id: string): number {
    return stats.value.levelStars[id] ?? 0;
  }

  const summaryText = $derived.by(() => {
    if (!mode) return '';
    const cfg = MODES[mode];
    if (mode === 'level' && chosenLevelId) {
      const lvl = LEVELS.find((l) => l.id === chosenLevelId);
      return `Levels - ${lvl?.title ?? chosenLevelId}`;
    }
    const size = settings.value.boardSize;
    const seedPart = chosenSeed ? ` - Steinfolge "${chosenSeed.value}"` : '';
    return `${cfg.label} ${size}x${size}${seedPart}`;
  });
</script>

<Modal {open} {inline} title="Neue Partie" {onClose}>
  <div class="wizard">
    <div class="steps" role="list">
      <span class="step" class:active={step === 1} class:done={step > 1}>1. Modus</span>
      <span
        class="step"
        class:active={step === 2}
        class:done={step > 2}
        class:disabled={step === 1}
      >
        2. Optionen
      </span>
      <span class="step" class:active={step === 3} class:disabled={step < 3}>3. Start</span>
    </div>

    {#if step === 1}
      <div class="step-body">
        <h3>Welcher Modus?</h3>
        <div class="grid">
          {#each modeOrder as id}
            {@const cfg = MODES[id]}
            <button
              type="button"
              class={`card mode-${id}`}
              class:selected={mode === id}
              onclick={() => pickMode(id)}
            >
              <div class={`icon mode-${id}`}>
                <i class={`fa-solid ${cfg.icon}`}></i>
              </div>
              <div class="meta">
                <h4>{cfg.label}</h4>
                <p>{cfg.description}</p>
              </div>
              <i class="fa-solid fa-chevron-right chev"></i>
            </button>
          {/each}
        </div>
      </div>
    {:else if step === 2 && mode === 'level'}
      <div class="step-body">
        <h3>Welches Level?</h3>
        <div class="levels">
          {#each LEVELS as level, i (level.id)}
            {@const done = completedLevels.has(level.id)}
            {@const prev = i === 0 || completedLevels.has(LEVELS[i - 1].id)}
            {@const locked = !done && !prev}
            {@const stars = levelStars(level.id)}
            <button
              type="button"
              class="level"
              class:selected={chosenLevelId === level.id}
              class:done
              class:locked
              disabled={locked}
              onclick={() => pickLevel(level.id)}
            >
              <span class="num">{i + 1}</span>
              <span class="lname">{level.title}</span>
              <span class="lstars">
                {#each [1, 2, 3] as n}
                  <i class={`fa-solid fa-star ${n <= stars ? 'full' : 'gone'}`}></i>
                {/each}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {:else if step === 2 && mode}
      <div class="step-body">
        <h3>Brettgröße</h3>
        <div class="size-grid">
          {#each sizes as s}
            <button
              type="button"
              class="size-tile"
              class:selected={settings.value.boardSize === s}
              onclick={() => pickSize(s)}
            >
              <div class="grid-preview" style:--cells={s}>
                {#each Array(s * s) as _, i (i)}
                  <span></span>
                {/each}
              </div>
              <strong>{s} x {s}</strong>
              <small>
                {s === 6 ? 'Schnell und knackig' : s === 8 ? 'Knapp und taktisch' : s === 10 ? 'Klassisch' : 'Weitläufig'}
              </small>
            </button>
          {/each}
        </div>

        <div class="seed-toggle">
          <button class="ghost" type="button" onclick={() => (useCustomSeed = !useCustomSeed)}>
            <i class="fa-solid fa-key"></i>
            {useCustomSeed ? 'Ohne feste Steinfolge' : 'Eigene Steinfolge wählen'}
          </button>
          {#if useCustomSeed}
            <p class="seed-info">
              Tippe ein Stichwort ein -- daraus wird eine Stein-Reihenfolge erzeugt, die immer gleich
              bleibt. Spiele dieselbe Folge mehrmals und versuche dich selbst zu schlagen.
            </p>
            <div class="seed-row">
              <input
                type="text"
                placeholder="z.B. klotz, sonntag, 42"
                bind:value={seedInput}
                onkeydown={(e) => {
                  if (e.key === 'Enter') {
                    applyCustomSeed();
                  }
                }}
              />
              <button class="primary" type="button" onclick={applyCustomSeed} disabled={!seedInput.trim()}>
                Übernehmen
              </button>
            </div>
          {/if}
        </div>
      </div>
    {:else if step === 3}
      <div class="step-body summary">
        <div class="big-icon">
          <i class={`fa-solid ${mode ? MODES[mode].icon : 'fa-circle-play'}`}></i>
        </div>
        <h3>Startbereit</h3>
        <p class="summary-line">{summaryText}</p>

        <ul class="checklist">
          <li><i class="fa-solid fa-check"></i> Drag &amp; Drop oder Tab + Pfeile + Enter</li>
          <li><i class="fa-solid fa-check"></i> Specials werden mit Combos verdient</li>
          <li><i class="fa-solid fa-check"></i> Solange Specials da sind, kein Game Over</li>
        </ul>
      </div>
    {/if}
  </div>

  {#snippet footer()}
    {#if step > 1}
      <button class="ghost" type="button" onclick={back}>
        <i class="fa-solid fa-arrow-left"></i>
        Zurück
      </button>
    {/if}
    {#if step === 3}
      <button class="primary" type="button" onclick={start}>
        <i class="fa-solid fa-play"></i>
        Spiel starten
      </button>
    {/if}
  {/snippet}
</Modal>

<style>
  .wizard {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .steps {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }

  .step {
    flex: 1;
    text-align: center;
    padding: 6px 10px;
    border-radius: 999px;
    color: var(--text-muted);
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .step.active {
    background: var(--accent);
    color: white;
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.35);
  }

  .step.done {
    color: var(--success);
  }

  .step.disabled {
    opacity: 0.45;
  }

  .step-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  h3 {
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card {
    position: relative;
    display: grid;
    grid-template-columns: 52px 1fr 18px;
    gap: 14px;
    padding: 12px 14px;
    align-items: center;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    overflow: hidden;
    transition: transform var(--transition-fast), border-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, var(--mode-tint, transparent) 0%, transparent 60%);
    opacity: 0.4;
    pointer-events: none;
    transition: opacity var(--transition-fast);
  }

  .card:hover {
    transform: translateY(-2px);
    border-color: var(--mode-color, var(--accent));
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
  }

  .card.selected {
    border-color: var(--mode-color, var(--accent));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--mode-color, var(--accent)) 40%, transparent);
  }

  .card.mode-endless { --mode-color: #6366f1; --mode-tint: rgba(99, 102, 241, 0.18); }
  .card.mode-daily { --mode-color: #f59e0b; --mode-tint: rgba(245, 158, 11, 0.18); }
  .card.mode-level { --mode-color: #22c55e; --mode-tint: rgba(34, 197, 94, 0.18); }
  .card.mode-timed { --mode-color: #ef4444; --mode-tint: rgba(239, 68, 68, 0.18); }
  .card.mode-reverse { --mode-color: #a855f7; --mode-tint: rgba(168, 85, 247, 0.18); }
  .card.mode-shrink { --mode-color: #14b8a6; --mode-tint: rgba(20, 184, 166, 0.18); }

  .icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--mode-color, var(--accent)) 0%, color-mix(in srgb, var(--mode-color, var(--accent)) 50%, black 50%) 100%);
    border-radius: 50%;
    color: white;
    font-size: 22px;
    box-shadow: 0 4px 14px color-mix(in srgb, var(--mode-color, var(--accent)) 50%, transparent);
  }

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }

  .meta p {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .chev {
    color: var(--text-muted);
    font-size: 14px;
  }

  .card:hover .chev {
    color: var(--mode-color, var(--accent));
    transform: translateX(4px);
  }

  /* Levels */
  .levels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .level {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text);
    text-align: left;
    transition: transform var(--transition-fast), border-color var(--transition-fast);
  }

  .level:hover:not(:disabled) {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .level.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.32);
  }

  .level.done {
    border-color: rgba(34, 197, 94, 0.4);
  }

  .level.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .num {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    color: white;
    font-weight: 800;
    font-size: 13px;
  }

  .level.done .num {
    background: linear-gradient(135deg, #facc15, #f59e0b);
    color: #4a2306;
  }

  .level.locked .num {
    background: var(--surface-strong);
    color: var(--text-muted);
  }

  .lname {
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lstars {
    display: flex;
    gap: 1px;
    font-size: 10px;
  }

  .lstars .full {
    color: #f59e0b;
    text-shadow: 0 0 4px rgba(245, 158, 11, 0.5);
  }

  .lstars .gone {
    color: var(--border);
  }

  /* Brettgrößen */
  .size-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .size-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--text);
    transition: transform var(--transition-fast), border-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .size-tile:hover,
  .size-tile.selected {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .size-tile.selected {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
  }

  .grid-preview {
    display: grid;
    grid-template-columns: repeat(var(--cells), 1fr);
    gap: 1px;
    width: 70px;
    height: 70px;
    background: var(--board-bg);
    padding: 4px;
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .grid-preview span {
    background: var(--cell-empty);
    border-radius: 1px;
  }

  .size-tile strong {
    font-size: 16px;
    font-weight: 700;
    color: var(--accent);
  }

  .size-tile small {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* Seed */
  .seed-toggle {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }

  .seed-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .seed-info {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.45;
  }

  /* Step 3 -- Summary */
  .summary {
    align-items: center;
    text-align: center;
  }

  .big-icon {
    width: 84px;
    height: 84px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    border-radius: 50%;
    color: white;
    font-size: 36px;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
  }

  .summary-line {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--accent);
  }

  .checklist {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }

  .checklist li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--text);
  }

  .checklist i {
    color: var(--success);
  }
</style>
