<script lang="ts">
  import type { GameMode } from '../game/types';
  import { MODES } from '../game/modes';
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    mode: GameMode | null;
    onClose: () => void;
  };

  let { open, mode, onClose }: Props = $props();

  const tips: Record<GameMode, { title: string; tip: string; controls: string[] }> = {
    endless: {
      title: 'Endless',
      tip: 'Kein Druck. Lege so lange Steine, bis nichts mehr passt. Solvability-Garantie schiebt dir nur Pools, mit denen mind. ein Stein platzierbar ist.',
      controls: ['Drag & Drop', 'Tab + Pfeile + Enter', 'Undo einmal pro Partie'],
    },
    daily: {
      title: 'Tages-Challenge',
      tip: 'Heute fuer alle der gleiche Stein-Verlauf -- vergleichbarer Highscore. Die Solvability-Garantie ist hier abgeschaltet.',
      controls: ['Reine Zufallsfolge anhand des Datums', 'Tagesrangliste in der Statistik'],
    },
    level: {
      title: 'Levels',
      tip: 'Erreiche das Punktziel innerhalb der Zugzahl. Block-Felder sind nicht raeumbar, Eis-Felder tauen, wenn die Reihe oder Spalte frei wird.',
      controls: ['Punkte-Ziel', 'Begrenzte Zuege', 'Block + Eis im Brett'],
    },
    timed: {
      title: 'Zeitrennen',
      tip: 'Drei Minuten, so viele Punkte wie moeglich. Combos zaehlen doppelt, weil Zeit knapp ist.',
      controls: ['180 Sekunden', 'Specials gelegentlich im Pool', 'Combo-Multiplikator bis x3'],
    },
    reverse: {
      title: 'Reverse',
      tip: 'Brett startet voll. Ziel: 8 Linien raeumen, bevor dir der Pool ausgeht. Specials helfen oeffter.',
      controls: ['Initial vorbelegtes Brett', 'Ziel: 8 geraumte Linien', 'Specials im Pool'],
    },
    shrink: {
      title: 'Shrink',
      tip: 'Brett schrumpft alle 12 Zuege um eine Reihe nach innen. Wer bleibt am laengsten am Leben?',
      controls: ['Brettrand wird zu Block', 'Zuegen-Druck baut sich auf'],
    },
  };

  const data = $derived(mode ? tips[mode] : null);
  const cfg = $derived(mode ? MODES[mode] : null);
</script>

<Modal {open} title={data?.title ?? 'Modus'} {onClose}>
  {#if data && cfg}
    <div class="hint">
      <div class="icon">
        <i class={`fa-solid ${cfg.icon}`}></i>
      </div>
      <p class="lead">{data.tip}</p>
      <ul>
        {#each data.controls as c}
          <li>
            <i class="fa-solid fa-circle-check"></i>
            <span>{c}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  {#snippet footer()}
    <button class="primary" onclick={onClose}>Los</button>
  {/snippet}
</Modal>

<style>
  .hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
  }

  .icon {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--surface-strong);
    color: var(--accent);
    font-size: 28px;
  }

  .lead {
    margin: 0;
    color: var(--text-muted);
    line-height: 1.5;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-self: stretch;
    text-align: left;
  }

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }

  li i {
    color: var(--success);
  }
</style>
