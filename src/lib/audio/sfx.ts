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

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let convolver: ConvolverNode | null = null;
let convolverWet: GainNode | null = null;
let lastPlaceAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      (window.AudioContext as typeof AudioContext | undefined) ??
      ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(ctx.destination);

    // Sehr kurzer Reverb für Tiefe
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulseResponse(ctx, 0.45, 2);
    convolverWet = ctx.createGain();
    convolverWet.gain.value = 0.18;
    convolver.connect(convolverWet);
    convolverWet.connect(masterGain);
  }
  return ctx;
}

function makeImpulseResponse(c: AudioContext, durationSec: number, decay: number): AudioBuffer {
  const rate = c.sampleRate;
  const length = Math.floor(rate * durationSec);
  const impulse = c.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

type ToneOpts = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay?: number;
  release?: number;
  filterFreq?: number;
  filterQ?: number;
  detune?: number;
  pitchEnvelope?: { from: number; to: number; time: number };
  reverb?: number;
};

function tone(freq: number, durationMs: number, opts: ToneOpts = {}) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const {
    type = 'sine',
    gain = 0.08,
    attack = 0.005,
    decay = durationMs / 1000,
    release = 0.04,
    filterFreq,
    filterQ = 1,
    detune = 0,
    pitchEnvelope,
    reverb = 0,
  } = opts;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  if (pitchEnvelope) {
    osc.frequency.setValueAtTime(pitchEnvelope.from, now);
    osc.frequency.exponentialRampToValueAtTime(pitchEnvelope.to, now + pitchEnvelope.time);
  }

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(gain * 0.6, now + attack + decay * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + release);

  let last: AudioNode = osc;
  if (filterFreq) {
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    last.connect(filter);
    last = filter;
  }
  last.connect(g);
  g.connect(masterGain);
  if (reverb > 0 && convolver) {
    const send = c.createGain();
    send.gain.value = reverb;
    g.connect(send);
    send.connect(convolver);
  }

  osc.start(now);
  osc.stop(now + attack + decay + release + 0.02);
}

function noise(durationMs: number, gainVal = 0.05, filterFreq = 1200, filterType: BiquadFilterType = 'lowpass') {
  const c = getCtx();
  if (!c || !masterGain) return;
  const buffer = c.createBuffer(1, Math.max(1, c.sampleRate * (durationMs / 1000)), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = 1.5;
  const g = c.createGain();
  const now = c.currentTime;
  g.gain.setValueAtTime(gainVal, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start();
}

function click(intensity = 1.0) {
  const c = getCtx();
  if (!c || !masterGain) return;
  // Sehr kurzer hochfrequenter Transient (Knack)
  const now = c.currentTime;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.012), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2200;
  hp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.value = 0.18 * intensity;
  src.connect(hp);
  hp.connect(g);
  g.connect(masterGain);
  src.start(now);
}

function pitchForSize(cells: number): number {
  // Kleinere Steine knackiger, größere dumpfer
  const base = 540;
  const factor = Math.pow(0.92, Math.max(0, cells - 1));
  return base * factor;
}

let placeVariant = 0;

// ---- Place-Varianten zum A/B-Vergleich im Sound-Lab ----

function placeV1SoftHybrid(cells: number): void {
  // Aktuelle Implementierung: Click + warmer Triangle + Sub-Bass + Wood-Hauch
  const baseFreq = pitchForSize(cells);
  click(0.7 + Math.min(0.3, cells * 0.05));
  placeVariant = (placeVariant + 1) % 3;
  const detune = (placeVariant - 1) * 18;
  tone(baseFreq, 110, {
    type: 'triangle',
    gain: 0.1,
    attack: 0.001,
    decay: 0.06,
    release: 0.05,
    detune,
    pitchEnvelope: { from: baseFreq * 1.3, to: baseFreq, time: 0.025 },
    reverb: 0.25,
  });
  tone(baseFreq * 0.5, 140, {
    type: 'sine',
    gain: 0.05 + Math.min(0.07, cells * 0.012),
    attack: 0.002,
    decay: 0.1,
    release: 0.05,
    filterFreq: 800,
  });
  if (cells >= 4) noise(28, 0.04, 3000, 'bandpass');
}

function placeV2WoodKlack(cells: number): void {
  // Trockener Holzklack: kurzer harter Anschlag, kein Bass, kein Reverb
  const baseFreq = pitchForSize(cells) * 0.85;
  click(0.5);
  noise(40, 0.06 + Math.min(0.04, cells * 0.005), 2400, 'bandpass');
  tone(baseFreq, 70, {
    type: 'triangle',
    gain: 0.08,
    attack: 0.0005,
    decay: 0.04,
    release: 0.02,
    filterFreq: 1500,
  });
}

function placeV3MechanikTech(cells: number): void {
  // Sauberer mechanischer Click mit metallischem Mini-Sustain, präzise
  const baseFreq = pitchForSize(cells) * 1.2;
  click(1.0);
  tone(baseFreq, 60, {
    type: 'square',
    gain: 0.06,
    attack: 0.0005,
    decay: 0.025,
    release: 0.025,
    filterFreq: baseFreq * 3,
    filterQ: 4,
  });
  noise(20, 0.03, 5000, 'highpass');
  tone(baseFreq * 2, 40, {
    type: 'sine',
    gain: 0.025,
    attack: 0.001,
    decay: 0.03,
    release: 0.02,
  });
}

function placeV4PluschFilz(cells: number): void {
  // Weich, kein Click, gefilterter dumpfer Body, lange Release
  const baseFreq = pitchForSize(cells) * 0.7;
  tone(baseFreq, 180, {
    type: 'sine',
    gain: 0.1 + Math.min(0.05, cells * 0.008),
    attack: 0.005,
    decay: 0.12,
    release: 0.1,
    filterFreq: 600,
    pitchEnvelope: { from: baseFreq * 1.15, to: baseFreq, time: 0.06 },
  });
  tone(baseFreq * 0.5, 220, {
    type: 'sine',
    gain: 0.05,
    attack: 0.01,
    decay: 0.15,
    release: 0.1,
    filterFreq: 400,
  });
}

function placeV5GlasCrystal(cells: number): void {
  // Heller glasiger Anschlag mit kleinem Resonanz-Sustain
  const baseFreq = pitchForSize(cells) * 1.6;
  click(0.4);
  tone(baseFreq, 200, {
    type: 'sine',
    gain: 0.08,
    attack: 0.001,
    decay: 0.16,
    release: 0.1,
    reverb: 0.5,
  });
  tone(baseFreq * 1.5, 140, {
    type: 'triangle',
    gain: 0.04,
    attack: 0.002,
    decay: 0.1,
    release: 0.08,
    reverb: 0.6,
  });
  if (cells >= 3) {
    tone(baseFreq * 2, 100, {
      type: 'sine',
      gain: 0.025,
      attack: 0.005,
      decay: 0.08,
      release: 0.05,
      reverb: 0.7,
    });
  }
}

function placeV6PopBubble(cells: number): void {
  // Pop/Bubble: schnelle Pitch-Up-Kurve, freundlich, kurz
  const baseFreq = pitchForSize(cells);
  tone(baseFreq, 80, {
    type: 'triangle',
    gain: 0.1,
    attack: 0.001,
    decay: 0.05,
    release: 0.04,
    pitchEnvelope: { from: baseFreq * 0.6, to: baseFreq * 1.4, time: 0.05 },
    reverb: 0.15,
  });
  tone(baseFreq * 2, 50, {
    type: 'sine',
    gain: 0.04,
    attack: 0.002,
    decay: 0.04,
    release: 0.02,
  });
}

export type PlaceVariantId = 1 | 2 | 3 | 4 | 5 | 6;

export function playPlaceVariant(variant: PlaceVariantId, cells: number = 4): void {
  switch (variant) {
    case 1: placeV1SoftHybrid(cells); break;
    case 2: placeV2WoodKlack(cells); break;
    case 3: placeV3MechanikTech(cells); break;
    case 4: placeV4PluschFilz(cells); break;
    case 5: placeV5GlasCrystal(cells); break;
    case 6: placeV6PopBubble(cells); break;
  }
}

export function playSfx(
  kind: SfxKind,
  enabled: boolean,
  options: { pitch?: number; cells?: number; combo?: number } = {},
): void {
  if (!enabled) return;
  const now = performance.now();
  switch (kind) {
    case 'place': {
      if (now - lastPlaceAt < 60) return;
      lastPlaceAt = now;
      const cells = options.cells ?? 1;
      // Aktive Place-Variante: V6 Pop/Bubble. Alle anderen bleiben im
      // Sound-Lab unter /sound-lab fuer A/B-Vergleiche verfügbar.
      placeV6PopBubble(cells);
      break;
    }
    case 'clear': {
      const combo = options.combo ?? 1;
      const baseRoot = 523;
      // Aufsteigende Major-Penta-Kette mit Gloss-Schimmer
      const intervals = [0, 4, 7, 12, 16, 19, 24];
      const steps = Math.min(intervals.length, 3 + Math.min(4, combo));
      const transposeSemis = (combo - 1) * 2;
      for (let i = 0; i < steps; i++) {
        const semis = intervals[i] + transposeSemis;
        const f = baseRoot * Math.pow(2, semis / 12);
        setTimeout(() => {
          tone(f, 160, {
            type: 'triangle',
            gain: 0.08,
            attack: 0.005,
            decay: 0.12,
            release: 0.08,
            reverb: 0.4,
          });
          tone(f * 2, 80, {
            type: 'sine',
            gain: 0.03,
            attack: 0.002,
            decay: 0.06,
            release: 0.03,
          });
        }, i * 55);
      }
      // Final-Sparkle
      setTimeout(() => {
        tone(baseRoot * 4, 200, {
          type: 'sine',
          gain: 0.04,
          attack: 0.005,
          decay: 0.18,
          release: 0.1,
          reverb: 0.6,
        });
      }, steps * 55 + 30);
      break;
    }
    case 'bomb': {
      const c = getCtx();
      if (!c || !masterGain) break;
      const now = c.currentTime;

      // Phase 1: Zündung -- harter hochfrequenter Crack
      click(2.0);
      noise(60, 0.18, 6000, 'bandpass');

      // Phase 2: Initialer Punch -- breiter mid-frequency Hit
      const punch = c.createOscillator();
      punch.type = 'square';
      const punchGain = c.createGain();
      const punchFilter = c.createBiquadFilter();
      punchFilter.type = 'lowpass';
      punchFilter.frequency.setValueAtTime(1500, now);
      punchFilter.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      punchFilter.Q.value = 6;
      punch.frequency.setValueAtTime(220, now);
      punch.frequency.exponentialRampToValueAtTime(45, now + 0.1);
      punchGain.gain.setValueAtTime(0.0001, now);
      punchGain.gain.exponentialRampToValueAtTime(0.32, now + 0.005);
      punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      punch.connect(punchFilter);
      punchFilter.connect(punchGain);
      punchGain.connect(masterGain);
      if (convolver) {
        const send = c.createGain();
        send.gain.value = 0.4;
        punchGain.connect(send);
        send.connect(convolver);
      }
      punch.start(now);
      punch.stop(now + 0.22);

      // Phase 3: Sub-Boom -- tiefer Sweep mit Sättigung
      tone(80, 600, {
        type: 'sawtooth',
        gain: 0.28,
        attack: 0.003,
        decay: 0.5,
        release: 0.2,
        filterFreq: 380,
        filterQ: 8,
        pitchEnvelope: { from: 180, to: 28, time: 0.32 },
        reverb: 0.55,
      });

      // Phase 4: Stereo-Rumble -- breites tieffrequentes Rauschen
      noise(700, 0.16, 280, 'lowpass');

      // Phase 5: Druckwelle-Whoosh nach dem Boom
      setTimeout(() => {
        noise(380, 0.1, 1800, 'bandpass');
        tone(55, 420, {
          type: 'sine',
          gain: 0.14,
          attack: 0.005,
          decay: 0.4,
          release: 0.15,
          reverb: 0.6,
        });
      }, 80);

      // Phase 6: Splitter-Schrapnell -- mehrere kurze Hochton-Pings versetzt
      [120, 180, 240, 320].forEach((delay, i) => {
        setTimeout(() => {
          noise(60, 0.04 - i * 0.005, 5000 + i * 800, 'highpass');
          tone(2400 + i * 600, 50, {
            type: 'triangle',
            gain: 0.04,
            attack: 0.001,
            decay: 0.05,
            release: 0.02,
          });
        }, delay);
      });

      // Phase 7: Langer Hall-Tail
      setTimeout(() => {
        tone(38, 700, {
          type: 'sine',
          gain: 0.08,
          attack: 0.05,
          decay: 0.6,
          release: 0.3,
          reverb: 0.85,
        });
      }, 280);

      break;
    }
    case 'hammer': {
      click(1.5);
      tone(220, 60, {
        type: 'square',
        gain: 0.13,
        attack: 0.001,
        decay: 0.04,
        release: 0.04,
        pitchEnvelope: { from: 380, to: 200, time: 0.02 },
      });
      noise(90, 0.06, 1800, 'bandpass');
      setTimeout(() => {
        tone(110, 110, { type: 'sine', gain: 0.06, decay: 0.12, reverb: 0.3 });
      }, 35);
      break;
    }
    case 'joker': {
      // Aufsteigender Glitzer-Sweep mit Akkord
      const root = 880;
      const arp = [0, 4, 7, 12, 16];
      arp.forEach((s, i) => {
        setTimeout(() => {
          const f = root * Math.pow(2, s / 12);
          tone(f, 130, {
            type: 'sine',
            gain: 0.06,
            attack: 0.003,
            decay: 0.1,
            release: 0.08,
            reverb: 0.55,
          });
          tone(f * 1.5, 80, { type: 'triangle', gain: 0.03, decay: 0.07 });
        }, i * 38);
      });
      // Gloss-Schwanz
      setTimeout(() => {
        tone(2637, 280, {
          type: 'triangle',
          gain: 0.04,
          attack: 0.01,
          decay: 0.25,
          release: 0.15,
          reverb: 0.7,
        });
      }, arp.length * 38);
      break;
    }
    case 'earned': {
      // Levelup-Stinger
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => {
          tone(f, 140, {
            type: 'triangle',
            gain: 0.08,
            attack: 0.003,
            decay: 0.1,
            release: 0.08,
            reverb: 0.45,
          });
          tone(f * 0.5, 90, { type: 'sine', gain: 0.04, decay: 0.08 });
        }, i * 75);
      });
      setTimeout(() => click(0.6), notes.length * 75);
      break;
    }
    case 'won': {
      // Drei-Sterne-Fanfare mit Akkord-Schluss
      const melody = [523, 659, 784, 1047, 1319];
      melody.forEach((f, i) => {
        setTimeout(() => {
          tone(f, 220, {
            type: 'triangle',
            gain: 0.09,
            attack: 0.005,
            decay: 0.16,
            release: 0.12,
            reverb: 0.5,
          });
          tone(f * 2, 120, { type: 'sine', gain: 0.04, decay: 0.1 });
        }, i * 130);
      });
      // Final-Akkord
      const finalAt = melody.length * 130;
      [523, 659, 784, 1047].forEach((f) => {
        setTimeout(() => {
          tone(f, 600, {
            type: 'triangle',
            gain: 0.05,
            attack: 0.01,
            decay: 0.5,
            release: 0.2,
            reverb: 0.7,
          });
        }, finalAt);
      });
      break;
    }
    case 'gameover': {
      const fall = [330, 247, 196, 165];
      fall.forEach((f, i) => {
        setTimeout(() => {
          tone(f, 320, {
            type: 'sine',
            gain: 0.07,
            attack: 0.005,
            decay: 0.28,
            release: 0.1,
            reverb: 0.4,
          });
        }, i * 180);
      });
      noise(180, 0.04, 800);
      break;
    }
    case 'coin': {
      tone(1760, 40, {
        type: 'triangle',
        gain: 0.08,
        attack: 0.001,
        decay: 0.04,
        release: 0.02,
      });
      setTimeout(
        () =>
          tone(2349, 90, {
            type: 'triangle',
            gain: 0.07,
            attack: 0.001,
            decay: 0.08,
            release: 0.03,
            reverb: 0.4,
          }),
        28,
      );
      setTimeout(
        () => tone(1568, 140, { type: 'sine', gain: 0.04, decay: 0.16, reverb: 0.5 }),
        70,
      );
      noise(28, 0.025, 7000, 'highpass');
      break;
    }
    case 'coin-jingle': {
      const seed = options.combo ?? 0;
      const baseFreqs = [1318, 1568, 1760, 2093, 2349, 2637, 3136, 3520];
      const count = 6 + Math.min(8, seed);
      for (let i = 0; i < count; i++) {
        const delay = i * 30 + Math.random() * 28;
        const f = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
        setTimeout(() => {
          tone(f, 70, {
            type: 'triangle',
            gain: 0.045,
            attack: 0.001,
            decay: 0.05,
            release: 0.04,
            reverb: 0.4,
          });
          if (i % 2 === 0) noise(28, 0.018, 8000, 'highpass');
        }, delay);
      }
      break;
    }
    case 'reward-stars': {
      // Drei aufsteigende Star-Pings mit Glanz-Schweif
      [880, 1175, 1568].forEach((f, i) => {
        setTimeout(() => {
          tone(f, 220, {
            type: 'triangle',
            gain: 0.09,
            attack: 0.005,
            decay: 0.16,
            release: 0.12,
            reverb: 0.6,
          });
          tone(f * 2, 140, { type: 'sine', gain: 0.04, decay: 0.12, reverb: 0.5 });
        }, i * 200);
      });
      setTimeout(() => {
        tone(2349, 480, {
          type: 'triangle',
          gain: 0.06,
          attack: 0.02,
          decay: 0.4,
          release: 0.2,
          reverb: 0.8,
        });
      }, 600);
      break;
    }
  }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
