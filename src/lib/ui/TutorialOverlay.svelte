<script lang="ts">
  import Modal from './Modal.svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
  };

  let { open, onClose }: Props = $props();

  let step = $state(0);

  const slides = [
    {
      title: 'Willkommen bei Klotz',
      icon: 'fa-cubes',
      text:
        'Lege die Steine auf das 10x10-Brett. Volle Reihen und volle Spalten verschwinden. Wenn nichts mehr passt, ist die Partie vorbei.',
    },
    {
      title: 'Drei Steine pro Runde',
      icon: 'fa-shapes',
      text:
        'Du bekommst immer drei Steine zur Auswahl. Erst wenn alle drei gelegt sind, kommen drei neue.',
    },
    {
      title: 'Combos zaehlen',
      icon: 'fa-bolt',
      text:
        'Wenn du mehrere Linien hintereinander raeumst, baust du eine Combo auf. Jede zaehlt mit Multiplikator.',
    },
    {
      title: 'Hilfen',
      icon: 'fa-life-ring',
      text:
        'Pro Partie kannst du einen Zug rueckgaengig machen und einen Stein gegen Punktabzug austauschen. Nutze sie, wenn es eng wird.',
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

<Modal {open} title={current.title} {onClose}>
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
    <button class="ghost" onclick={back} disabled={step === 0}>Zurueck</button>
    <button class="primary" onclick={next}>
      {last ? 'Los gehts' : 'Weiter'}
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
