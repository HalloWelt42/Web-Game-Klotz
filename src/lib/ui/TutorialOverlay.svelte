<script lang="ts">
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    inline?: boolean;
  };

  let { open, onClose, inline = false }: Props = $props();

  let step = $state(0);

  const slides = [
    {
      title: 'Willkommen bei Klotz',
      icon: 'fa-cubes',
      text:
        'Lege Steine auf das Brett. Volle Reihen und volle Spalten lösen sich gleichzeitig auf. Wenn keiner der Steine mehr passt, ist die Partie vorbei.',
    },
    {
      title: 'Drei Steine pro Runde',
      icon: 'fa-shapes',
      text:
        'Du bekommst immer drei Steine zur Auswahl. Erst wenn alle drei gelegt sind, kommen drei neue. Per Drag & Drop oder über Tab und die Pfeiltasten platzierst du sie.',
    },
    {
      title: 'Combos zählen doppelt',
      icon: 'fa-bolt',
      text:
        'Räumst du in mehreren Zügen hintereinander Linien, baust du eine Combo auf -- bis zu Multiplikator x3. Einfarbige Linien geben zusätzlich einen Mono-Bonus.',
    },
    {
      title: 'Specials als Lebensretter',
      icon: 'fa-bomb',
      text:
        'Bei Combo x3 verdienst du eine Bombe (3x3 leeren), bei x5 einen Hammer (eine Zelle), bei x7 einen Joker. Außerdem gibt es Specials nach geräumten Zellen, brettgrößen-skaliert. Maximaler Vorrat hängt vom Brett ab: 6x6 / 8x8 / 10x10 sind 2-3, 12x12 sind 4 pro Sorte. Solange Specials da sind, kann das Spiel nicht enden.',
    },
    {
      title: 'Modi für jeden Geschmack',
      icon: 'fa-shapes',
      text:
        'Endless für entspanntes Spielen, Tages-Challenge für Vergleiche, Levels mit Sternen, Zeitrennen, Reverse mit vorbelegtem Brett, Shrink mit schrumpfendem Spielfeld. Brettgröße zwischen 6x6 und 12x12 wählbar.',
    },
    {
      title: 'Pause und Fortschritt',
      icon: 'fa-pause',
      text:
        'Esc oder das Pause-Symbol pausiert. Deine Endless-Partie wird automatisch gespeichert -- du kannst später fortsetzen. Statistik, Erfolge und Replays findest du im Hauptmenü.',
    },
  ];

  function next() {
    if (step < slides.length - 1) step += 1;
    else onClose();
  }

  function back() {
    if (step > 0) step -= 1;
  }

  $effect(() => {
    if (open) step = 0;
  });

  const current = $derived(slides[step]);
  const last = $derived(step === slides.length - 1);
</script>

<Modal {open} title={current.title} {onClose} {inline}>
  <div class="slide">
    <div class="icon">
      <i class={`fa-solid ${current.icon}`}></i>
    </div>
    <p>{current.text}</p>
    <div class="dots" role="tablist">
      {#each slides as _s, i}
        <span class="dot" class:active={i === step}></span>
      {/each}
    </div>
  </div>
  {#snippet footer()}
    <button class="ghost" onclick={back} disabled={step === 0}>Zurück</button>
    <button class="primary" onclick={next}>
      {last ? 'Los geht es' : 'Weiter'}
    </button>
  {/snippet}
</Modal>

<style>
  .slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
  }

  .icon {
    font-size: 38px;
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    background: var(--surface-strong);
    color: var(--accent);
    border-radius: 50%;
    border: 1px solid var(--border);
  }

  p {
    margin: 0;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .dots {
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border);
    transition: background var(--transition-fast);
  }

  .dot.active {
    background: var(--accent);
  }
</style>
