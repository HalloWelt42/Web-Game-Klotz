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
  | 'coin-jingle';

let ctx: AudioContext | null = null;
let lastPlaceAt = 0;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      (window.AudioContext as typeof AudioContext | undefined) ??
      ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

type ToneOpts = {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay?: number;
  filterFreq?: number;
};

function tone(freq: number, durationMs: number, opts: ToneOpts = {}) {
  const c = getCtx();
  if (!c) return;
  const { type = 'sine', gain = 0.08, attack = 0.005, decay = durationMs / 1000, filterFreq } =
    opts;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  let last: AudioNode = osc;
  if (filterFreq) {
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    osc.connect(filter);
    last = filter;
  }
  last.connect(g);
  g.connect(c.destination);
  const now = c.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  osc.start(now);
  osc.stop(now + attack + decay + 0.05);
}

function noise(durationMs: number, gainVal = 0.05, filterFreq = 1200) {
  const c = getCtx();
  if (!c) return;
  const buffer = c.createBuffer(1, c.sampleRate * (durationMs / 1000), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.value = gainVal;
  const now = c.currentTime;
  g.gain.setValueAtTime(gainVal, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
}

function pitchForSize(cells: number): number {
  const base = 520;
  const factor = Math.pow(0.93, Math.max(0, cells - 1));
  return base * factor;
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
      if (now - lastPlaceAt < 70) return;
      lastPlaceAt = now;
      const freq = options.pitch ?? (options.cells ? pitchForSize(options.cells) : 440);
      tone(freq, 90, { type: 'triangle', gain: 0.07, decay: 0.08 });
      tone(freq * 0.5, 120, { type: 'sine', gain: 0.04, decay: 0.1 });
      break;
    }
    case 'clear': {
      const combo = options.combo ?? 1;
      const base = 660 + Math.min(8, combo) * 70;
      const steps = Math.min(5, 2 + combo);
      for (let i = 0; i < steps; i++) {
        setTimeout(() => {
          tone(base * Math.pow(1.18, i), 110, { type: 'sine', gain: 0.07, decay: 0.12 });
        }, i * 55);
      }
      break;
    }
    case 'bomb': {
      noise(400, 0.18, 800);
      tone(80, 350, { type: 'sawtooth', gain: 0.18, decay: 0.4, filterFreq: 600 });
      setTimeout(() => tone(55, 220, { type: 'sine', gain: 0.1, decay: 0.25 }), 80);
      break;
    }
    case 'hammer': {
      tone(180, 50, { type: 'square', gain: 0.12, decay: 0.06 });
      noise(80, 0.05, 2200);
      setTimeout(() => tone(120, 80, { type: 'sine', gain: 0.05, decay: 0.1 }), 40);
      break;
    }
    case 'joker': {
      const notes = [880, 1108, 1318, 1760];
      notes.forEach((f, i) => {
        setTimeout(() => tone(f, 110, { type: 'sine', gain: 0.06, decay: 0.16 }), i * 45);
      });
      setTimeout(() => tone(2637, 200, { type: 'triangle', gain: 0.04, decay: 0.25 }), 200);
      break;
    }
    case 'earned': {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => tone(f, 130, { type: 'triangle', gain: 0.07, decay: 0.18 }), i * 70);
      });
      break;
    }
    case 'won': {
      const melody = [523, 659, 784, 1047, 1319];
      melody.forEach((f, i) => {
        setTimeout(() => tone(f, 180, { type: 'triangle', gain: 0.08, decay: 0.22 }), i * 110);
      });
      break;
    }
    case 'coin': {
      tone(1760, 35, { type: 'triangle', gain: 0.08, decay: 0.04, attack: 0.001 });
      setTimeout(() => tone(2349, 90, { type: 'triangle', gain: 0.07, decay: 0.1 }), 30);
      setTimeout(() => tone(1568, 140, { type: 'sine', gain: 0.04, decay: 0.18 }), 70);
      noise(40, 0.025, 6000);
      break;
    }
    case 'coin-jingle': {
      const c = getCtx();
      if (!c) break;
      const seed = options.combo ?? 0;
      const baseFreqs = [1318, 1568, 1760, 2093, 2349, 2637, 3136];
      const count = 5 + Math.min(8, seed);
      for (let i = 0; i < count; i++) {
        const delay = i * 35 + Math.random() * 25;
        const f = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
        setTimeout(() => {
          tone(f, 60, { type: 'triangle', gain: 0.05, decay: 0.07, attack: 0.001 });
          if (i % 2 === 0) noise(35, 0.018, 7000);
        }, delay);
      }
      break;
    }
    case 'gameover': {
      tone(330, 280, { type: 'sine', gain: 0.07, decay: 0.3 });
      setTimeout(() => tone(247, 280, { type: 'sine', gain: 0.07, decay: 0.3 }), 180);
      setTimeout(() => tone(196, 420, { type: 'sine', gain: 0.07, decay: 0.5 }), 360);
      break;
    }
  }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
