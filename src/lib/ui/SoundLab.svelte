<script lang="ts">
  import { playSfx } from '../audio/sfx';

  type Variant = { label: string; opts?: { cells?: number; combo?: number; pitch?: number } };
  type SfxKind =
    | 'place'
    | 'clear'
    | 'gameover'
    | 'won'
    | 'bomb'
    | 'hammer'
    | 'joker'
    | 'earned'
    | 'coin'
    | 'coin-jingle'
    | 'reward-stars';

  type Entry = {
    letter: string;
    kind: SfxKind;
    name: string;
    purpose: string;
    description: string;
    variants?: Variant[];
  };

  const entries: Entry[] = [
    {
      letter: 'a',
      kind: 'place',
      name: 'place',
      purpose: 'Spielstein wird auf das Brett gelegt',
      description:
        'Hochfrequenter Knack-Transient + warmer Body-Ton mit kurzer Pitch-Senke. Sub-Bass + Holz-Anschlag skalieren mit Steingröße.',
      variants: [
        { label: '1 Zelle', opts: { cells: 1 } },
        { label: '4 Zellen', opts: { cells: 4 } },
        { label: '8 Zellen', opts: { cells: 8 } },
      ],
    },
    {
      letter: 'b',
      kind: 'clear',
      name: 'clear',
      purpose: 'Linie(n) wird geräumt',
      description:
        'Aufsteigende Major-Penta-Tonleiter mit Gloss-Schimmer und Final-Sparkle. Wird mit höherem Combo-Wert höher und länger.',
      variants: [
        { label: 'Combo 1', opts: { combo: 1 } },
        { label: 'Combo 3', opts: { combo: 3 } },
        { label: 'Combo 5', opts: { combo: 5 } },
      ],
    },
    {
      letter: 'c',
      kind: 'gameover',
      name: 'gameover',
      purpose: 'Spiel verloren -- kein Stein mehr platzierbar',
      description: 'Fallende Sinus-Folge (330 -> 165 Hz) mit kurzem Rauschen.',
    },
    {
      letter: 'd',
      kind: 'won',
      name: 'won',
      purpose: 'Spiel gewonnen -- Ziel erreicht',
      description: 'Fünfton-Aufstieg mit Reverb und finalem Akkord (C-E-G-C).',
    },
    {
      letter: 'e',
      kind: 'bomb',
      name: 'bomb',
      purpose: 'Bombe explodiert (3x3-Bereich leeren)',
      description:
        'Sieben-Phasen-Explosion: Knack, Mid-Punch, Sub-Boom-Sweep, Stereo-Rumble, Druckwelle, Splitter-Schrapnell, Hall-Tail.',
    },
    {
      letter: 'f',
      kind: 'hammer',
      name: 'hammer',
      purpose: 'Hammer schlägt eine einzelne Zelle frei',
      description: 'Harter Click + Square-Pitch-Drop + Bandpass-Rauschen + dumpfer Sinus-Echo.',
    },
    {
      letter: 'g',
      kind: 'joker',
      name: 'joker',
      purpose: 'Joker setzt einen Stein auf eine freie Zelle',
      description: 'Fünfstufiger Glitzer-Sweep mit Akkord, anschließend hoher Gloss-Tail.',
    },
    {
      letter: 'h',
      kind: 'earned',
      name: 'earned',
      purpose: 'Special wurde verdient (Combo x2/x3/x4 oder Linien-Meilenstein)',
      description: 'Vier-Ton-Levelup-Stinger (C5-E5-G5-C6) mit Sub-Sinus-Begleitung.',
    },
    {
      letter: 'i',
      kind: 'coin',
      name: 'coin',
      purpose: 'Einzelne Münze fliegt vom Brett zum Score-Anzeiger',
      description: 'Drei kurze Triangle-Pings (A6-D7-G6) mit Highpass-Rauschen.',
    },
    {
      letter: 'j',
      kind: 'coin-jingle',
      name: 'coin-jingle',
      purpose: 'Münzregen direkt nach geräumter Linie -- mehrere Münzen gleichzeitig',
      description: 'Zufallsstreuung aus 8 hohen Pitches, Anzahl und Streuung skalieren mit Combo.',
      variants: [
        { label: 'Combo 1', opts: { combo: 1 } },
        { label: 'Combo 4', opts: { combo: 4 } },
      ],
    },
    {
      letter: 'k',
      kind: 'reward-stars',
      name: 'reward-stars',
      purpose: 'Sterne-Belohnung nach gewonnener Partie (kommt nach won, leicht versetzt)',
      description: 'Drei aufsteigende Star-Pings (A5-D6-G6) mit Gloss-Schweif.',
    },
  ];

  function play(kind: SfxKind, opts?: { cells?: number; combo?: number; pitch?: number }) {
    playSfx(kind, true, opts ?? {});
  }
</script>

<main class="lab">
  <header class="head">
    <div>
      <h1>Klotz Sound-Lab</h1>
      <p class="sub">
        Interner Klangtest. Diese Seite ist bewusst nicht aus dem Spiel verlinkt --
        nur über die URL <code>/sound-lab</code> erreichbar.
      </p>
    </div>
  </header>

  <ol class="entries">
    {#each entries as e (e.kind)}
      <li class="entry">
        <div class="letter" aria-hidden="true">{e.letter}</div>
        <div class="meta">
          <h2><code>{e.name}</code> -- {e.purpose}</h2>
          <p class="desc">{e.description}</p>
          <div class="actions">
            {#if e.variants}
              {#each e.variants as v}
                <button type="button" class="btn" onclick={() => play(e.kind, v.opts)}>
                  <i class="fa-solid fa-play"></i>
                  {v.label}
                </button>
              {/each}
            {:else}
              <button type="button" class="btn" onclick={() => play(e.kind)}>
                <i class="fa-solid fa-play"></i>
                Abspielen
              </button>
            {/if}
          </div>
        </div>
      </li>
    {/each}
  </ol>

  <footer class="foot">
    <p>
      Kommentar-Vorlage: <em>"a) Stein-Klick zu hart, weicher / leiser"</em> oder
      <em>"e) Bombe perfekt"</em> -- pro Buchstabe ein Vorschlag.
    </p>
  </footer>
</main>

<style>
  .lab {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 18px 64px;
    color: var(--text);
    font-family: inherit;
  }

  .head {
    border-bottom: 1px solid var(--border);
    padding-bottom: 16px;
    margin-bottom: 20px;
  }

  h1 {
    margin: 0 0 6px;
    font-size: 24px;
    letter-spacing: -0.01em;
  }

  .sub {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .sub code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface-strong);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .entry {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 14px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .letter {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--accent), var(--accent-strong));
    color: white;
    font-weight: 800;
    font-size: 18px;
    border-radius: 50%;
    box-shadow: 0 4px 10px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .meta h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  .meta h2 code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface-strong);
    color: var(--accent);
    padding: 1px 8px;
    border-radius: 4px;
    font-size: 13px;
    margin-right: 4px;
  }

  .desc {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 999px;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .btn:hover {
    border-color: var(--accent);
    background: var(--surface);
  }

  .btn i {
    font-size: 10px;
    color: var(--accent);
  }

  .foot {
    margin-top: 20px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .foot p {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .foot em {
    color: var(--text);
    font-style: normal;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
  }
</style>
