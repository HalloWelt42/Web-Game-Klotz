<script lang="ts">
  import { game } from '../stores/game.svelte';
  import type { FxEvent } from '../stores/game.svelte';

  const cx = $derived(`${game.boardCenter.x}px`);
  const cy = $derived(`${game.boardCenter.y}px`);

  type Particle = { id: string; x: number; y: number; rot: number; color: string };

  function makeConfetti(seed: number): Particle[] {
    const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
    const out: Particle[] = [];
    let s = seed | 0;
    const rand = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 1000) / 1000;
    };
    for (let i = 0; i < 32; i++) {
      out.push({
        id: `${seed}-${i}`,
        x: (rand() - 0.5) * 240,
        y: -rand() * 280 - 20,
        rot: rand() * 720 - 360,
        color: colors[Math.floor(rand() * colors.length)],
      });
    }
    return out;
  }

  type SparkParticle = {
    id: string;
    angle: number;
    distance: number;
    size: number;
    color: string;
    delay: number;
  };

  function makeSparks(seed: number, count: number, palette: string[], maxDist = 120): SparkParticle[] {
    const out: SparkParticle[] = [];
    let s = seed | 0;
    const rand = () => {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) % 1000) / 1000;
    };
    for (let i = 0; i < count; i++) {
      out.push({
        id: `${seed}-s-${i}`,
        angle: (i / count) * Math.PI * 2 + rand() * 0.4,
        distance: 30 + rand() * (maxDist - 30),
        size: 4 + rand() * 6,
        color: palette[Math.floor(rand() * palette.length)],
        delay: rand() * 80,
      });
    }
    return out;
  }

  function cellPixelInfo(
    x: number,
    y: number,
  ): { px: number; py: number; size: number } | null {
    if (typeof document === 'undefined') return null;
    const cell = document.querySelector<HTMLElement>(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return null;
    const r = cell.getBoundingClientRect();
    return { px: r.left + r.width / 2, py: r.top + r.height / 2, size: r.width };
  }

  function boardPixelRect(): { left: number; top: number; width: number; height: number } | null {
    if (typeof document === 'undefined') return null;
    const board = document.querySelector<HTMLElement>('.board');
    if (!board) return null;
    const r = board.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  function scoreTargetCenter(): { x: number; y: number } | null {
    if (typeof document === 'undefined') return null;
    const el = document.querySelector<HTMLElement>('.value.primary');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  type SpecialResolved = {
    fx: FxEvent;
    px: number;
    py: number;
    size: number;
  };

  const specialFx = $derived.by<SpecialResolved[]>(() => {
    const out: SpecialResolved[] = [];
    for (const f of game.fx) {
      if (
        f.kind === 'bomb-burst' ||
        f.kind === 'hammer-strike' ||
        f.kind === 'joker-sparkle'
      ) {
        const info = cellPixelInfo(f.x, f.y);
        if (info) out.push({ fx: f, px: info.px, py: info.py, size: info.size });
      }
    }
    return out;
  });

  type WipeResolved = {
    fx: FxEvent;
    left: number;
    top: number;
    width: number;
    height: number;
  };

  type CoinResolved = {
    fx: FxEvent;
    sx: number;
    sy: number;
    tx: number;
    ty: number;
    delay: number;
  };

  const coinFx = $derived.by<CoinResolved[]>(() => {
    const out: CoinResolved[] = [];
    const target = scoreTargetCenter();
    if (!target) return out;
    const board = boardPixelRect();
    if (!board) return out;
    for (const f of game.fx) {
      if (f.kind !== 'coin') continue;
      const idx = Number(f.x) || 0;
      const angle = (idx * 137.5) % 360;
      const r = 30 + (idx % 4) * 18;
      const sx =
        board.left + board.width / 2 + Math.cos((angle * Math.PI) / 180) * r;
      const sy =
        board.top + board.height / 2 + Math.sin((angle * Math.PI) / 180) * r;
      out.push({ fx: f, sx, sy, tx: target.x, ty: target.y, delay: Number(f.payload) || 0 });
    }
    return out;
  });

  const wipeFx = $derived.by<WipeResolved[]>(() => {
    const out: WipeResolved[] = [];
    for (const f of game.fx) {
      if (f.kind === 'row-wipe') {
        const info = cellPixelInfo(0, f.y);
        const board = boardPixelRect();
        if (info && board) {
          out.push({
            fx: f,
            left: board.left + 6,
            top: info.py - info.size / 2,
            width: board.width - 12,
            height: info.size,
          });
        }
      } else if (f.kind === 'col-wipe') {
        const info = cellPixelInfo(f.x, 0);
        const board = boardPixelRect();
        if (info && board) {
          out.push({
            fx: f,
            left: info.px - info.size / 2,
            top: board.top + 6,
            width: info.size,
            height: board.height - 12,
          });
        }
      }
    }
    return out;
  });

  const screenShakeActive = $derived(
    game.fx.some((f) => f.kind === 'screen-shake'),
  );

  $effect(() => {
    const root = document.documentElement;
    if (screenShakeActive) {
      root.classList.add('klotz-shake');
      const t = setTimeout(() => root.classList.remove('klotz-shake'), 400);
      return () => {
        clearTimeout(t);
        root.classList.remove('klotz-shake');
      };
    }
  });

  const BOMB_PALETTE = ['#fde047', '#fb923c', '#ef4444', '#fef3c7'];
  const HAMMER_PALETTE = ['#cbd5e1', '#94a3b8', '#e2e8f0', '#f1f5f9'];
  const JOKER_PALETTE = ['#a78bfa', '#f472b6', '#22d3ee', '#fef3c7'];
</script>

<div class="overlay" aria-hidden="true" style:--cx={cx} style:--cy={cy}>
  {#each game.fx as f (f.id)}
    {#if f.kind === 'shock'}
      <div class="shock"></div>
    {:else if f.kind === 'confetti'}
      <div class="confetti">
        {#each makeConfetti(f.id) as p (p.id)}
          <span
            class="particle"
            style:--x={`${p.x}px`}
            style:--y={`${p.y}px`}
            style:--rot={`${p.rot}deg`}
            style:background={p.color}
          ></span>
        {/each}
      </div>
    {:else if f.kind === 'pop'}
      <div class="pop">{f.payload}</div>
    {/if}
  {/each}

  {#each coinFx as c (c.fx.id)}
    <div
      class="coin"
      style:--sx={`${c.sx}px`}
      style:--sy={`${c.sy}px`}
      style:--tx={`${c.tx}px`}
      style:--ty={`${c.ty}px`}
      style:--delay={`${c.delay}ms`}
    >
      <span class="coin-face">$</span>
    </div>
  {/each}

  {#each wipeFx as w (w.fx.id)}
    <div
      class={w.fx.kind === 'row-wipe' ? 'wipe row' : 'wipe col'}
      style:left={`${w.left}px`}
      style:top={`${w.top}px`}
      style:width={`${w.width}px`}
      style:height={`${w.height}px`}
    ></div>
  {/each}

  {#each specialFx as s (s.fx.id)}
    {@const cell = s.size}
    {@const cellGap = 4}
    {#if s.fx.kind === 'bomb-burst'}
      <div class="cell-fx" style:left={`${s.px}px`} style:top={`${s.py}px`}>
        <div
          class="bomb-region"
          style:width={`${cell * 3 + cellGap * 2}px`}
          style:height={`${cell * 3 + cellGap * 2}px`}
        ></div>
        <div class="bomb-flash"></div>
        <div class="bomb-ring"></div>
        <div class="bomb-ring delayed"></div>
        <div class="bomb-ring delayed-2"></div>
        {#each makeSparks(s.fx.id, 24, BOMB_PALETTE, 200) as sp (sp.id)}
          <span
            class="spark"
            style:--ang={`${sp.angle}rad`}
            style:--dist={`${sp.distance}px`}
            style:--size={`${sp.size}px`}
            style:--color={sp.color}
            style:--delay={`${sp.delay}ms`}
          ></span>
        {/each}
      </div>
    {:else if s.fx.kind === 'hammer-strike'}
      <div class="cell-fx" style:left={`${s.px}px`} style:top={`${s.py}px`}>
        <div class="hammer-region" style:width={`${cell}px`} style:height={`${cell}px`}></div>
        <div class="hammer-icon">
          <i class="fa-solid fa-hammer"></i>
        </div>
        {#each makeSparks(s.fx.id, 12, HAMMER_PALETTE, 70) as sp (sp.id)}
          <span
            class="crumb"
            style:--ang={`${sp.angle}rad`}
            style:--dist={`${sp.distance}px`}
            style:--size={`${sp.size}px`}
            style:--color={sp.color}
            style:--delay={`${sp.delay}ms`}
          ></span>
        {/each}
      </div>
    {:else if s.fx.kind === 'joker-sparkle'}
      <div class="cell-fx" style:left={`${s.px}px`} style:top={`${s.py}px`}>
        <div class="joker-region" style:width={`${cell}px`} style:height={`${cell}px`}></div>
        <div class="joker-glow"></div>
        {#each makeSparks(s.fx.id, 14, JOKER_PALETTE, 90) as sp (sp.id)}
          <span
            class="star"
            style:--ang={`${sp.angle}rad`}
            style:--dist={`${sp.distance}px`}
            style:--size={`${sp.size}px`}
            style:--color={sp.color}
            style:--delay={`${sp.delay}ms`}
          >
            <i class="fa-solid fa-star"></i>
          </span>
        {/each}
      </div>
    {/if}
  {/each}
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 70;
    overflow: hidden;
  }

  .shock {
    position: absolute;
    left: var(--cx);
    top: var(--cy);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 4px solid var(--accent);
    transform: translate(-50%, -50%);
    animation: shockwave 0.7s ease-out forwards;
    opacity: 0.6;
  }

  .confetti {
    position: absolute;
    left: var(--cx);
    top: var(--cy);
    width: 0;
    height: 0;
  }

  .particle {
    position: absolute;
    width: 8px;
    height: 14px;
    border-radius: 2px;
    transform-origin: center;
    animation: fall 1.2s ease-out forwards;
  }

  .pop {
    position: absolute;
    left: var(--cx);
    top: var(--cy);
    transform: translate(-50%, -50%);
    color: var(--success);
    font-size: 28px;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    animation: popUp 1s ease-out forwards;
  }

  .cell-fx {
    position: absolute;
    width: 0;
    height: 0;
  }

  .coin {
    position: absolute;
    left: var(--sx);
    top: var(--sy);
    width: 22px;
    height: 22px;
    margin-left: -11px;
    margin-top: -11px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fef9c3 0%, #facc15 35%, #b45309 90%);
    box-shadow: 0 0 12px rgba(250, 204, 21, 0.7), inset 0 -2px 0 rgba(0, 0, 0, 0.25),
      inset 0 2px 0 rgba(255, 255, 255, 0.5);
    color: #78350f;
    font-weight: 800;
    font-size: 12px;
    display: grid;
    place-items: center;
    --travel-x: calc(var(--tx) - var(--sx));
    --travel-y: calc(var(--ty) - var(--sy));
    animation: coin-fly 700ms cubic-bezier(0.5, -0.2, 0.5, 1.2) var(--delay) forwards;
    opacity: 0;
  }

  .coin-face {
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  @keyframes coin-fly {
    0% {
      transform: translate(0, 0) scale(0.4) rotate(0deg);
      opacity: 0;
    }
    20% {
      transform: translate(0, -20px) scale(1) rotate(120deg);
      opacity: 1;
    }
    85% {
      transform: translate(calc(var(--travel-x) * 0.95), calc(var(--travel-y) - 30px)) scale(0.9) rotate(540deg);
      opacity: 1;
    }
    100% {
      transform: translate(var(--travel-x), var(--travel-y)) scale(0.3) rotate(720deg);
      opacity: 0;
    }
  }

  .wipe {
    position: absolute;
    border-radius: var(--radius-sm);
    overflow: hidden;
    pointer-events: none;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%);
    box-shadow: 0 0 16px rgba(255, 255, 255, 0.6), 0 0 32px var(--accent);
  }

  .wipe.row {
    animation: wipe-row 0.55s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  .wipe.col {
    background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%);
    animation: wipe-col 0.55s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  @keyframes wipe-row {
    0% {
      opacity: 0;
      transform: scaleX(0);
      transform-origin: center;
    }
    25% {
      opacity: 1;
      transform: scaleX(1);
    }
    100% {
      opacity: 0;
      transform: scaleX(1) translateX(0);
    }
  }

  @keyframes wipe-col {
    0% {
      opacity: 0;
      transform: scaleY(0);
      transform-origin: center;
    }
    25% {
      opacity: 1;
      transform: scaleY(1);
    }
    100% {
      opacity: 0;
      transform: scaleY(1);
    }
  }

  .bomb-region {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-md);
    background: radial-gradient(circle, rgba(251, 146, 60, 0.55) 0%, rgba(239, 68, 68, 0.18) 70%, transparent 100%);
    border: 2px solid rgba(251, 146, 60, 0.7);
    box-shadow: 0 0 32px rgba(251, 146, 60, 0.6);
    animation: bomb-region 0.9s ease-out forwards;
  }

  .hammer-region {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-sm);
    background: radial-gradient(circle, rgba(241, 245, 249, 0.55) 0%, transparent 75%);
    border: 2px solid rgba(241, 245, 249, 0.7);
    box-shadow: 0 0 18px rgba(241, 245, 249, 0.5);
    animation: hammer-region 0.7s ease-out forwards;
  }

  .joker-region {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-sm);
    background: radial-gradient(circle, rgba(192, 132, 252, 0.5) 0%, transparent 80%);
    border: 2px solid rgba(244, 114, 182, 0.7);
    box-shadow: 0 0 22px rgba(192, 132, 252, 0.6);
    animation: joker-region 0.9s ease-out forwards;
  }

  .bomb-flash {
    position: absolute;
    left: 0;
    top: 0;
    width: 120px;
    height: 120px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, #fef3c7 0%, #fb923c 30%, transparent 70%);
    animation: bomb-flash 0.6s ease-out forwards;
    filter: blur(3px);
  }

  .bomb-ring {
    position: absolute;
    left: 0;
    top: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 6px solid #fb923c;
    transform: translate(-50%, -50%);
    animation: bomb-ring 0.95s ease-out forwards;
  }

  .bomb-ring.delayed {
    animation-delay: 130ms;
    border-color: #ef4444;
  }

  .bomb-ring.delayed-2 {
    animation-delay: 260ms;
    border-color: #fde047;
  }

  .spark {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: var(--color);
    box-shadow: 0 0 12px var(--color);
    transform: translate(-50%, -50%);
    animation: spark-fly 0.7s ease-out var(--delay) forwards;
  }

  .hammer-icon {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -120%);
    color: #f1f5f9;
    font-size: 28px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    animation: hammer-strike 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .crumb {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--size);
    height: var(--size);
    background: var(--color);
    border-radius: 1px;
    transform: translate(-50%, -50%);
    animation: crumb-fall 0.6s ease-out var(--delay) forwards;
  }

  .joker-glow {
    position: absolute;
    left: 0;
    top: 0;
    width: 70px;
    height: 70px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(248, 200, 220, 0.7) 0%, transparent 70%);
    animation: joker-glow 0.8s ease-out forwards;
  }

  .star {
    position: absolute;
    left: 0;
    top: 0;
    color: var(--color);
    font-size: var(--size);
    transform: translate(-50%, -50%);
    text-shadow: 0 0 6px var(--color);
    animation: star-fly 0.9s ease-out var(--delay) forwards;
  }

  @keyframes shockwave {
    0% {
      width: 40px;
      height: 40px;
      opacity: 0.7;
      border-width: 6px;
    }
    100% {
      width: 540px;
      height: 540px;
      opacity: 0;
      border-width: 1px;
    }
  }

  @keyframes fall {
    0% {
      transform: translate(0, 0) rotate(0);
      opacity: 1;
    }
    100% {
      transform: translate(var(--x), calc(var(--y) + 360px)) rotate(var(--rot));
      opacity: 0;
    }
  }

  @keyframes popUp {
    0% {
      transform: translate(-50%, -50%) scale(0.6);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translate(-50%, calc(-50% - 80px)) scale(1.1);
      opacity: 0;
    }
  }

  @keyframes bomb-flash {
    0% {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 1;
    }
    40% {
      opacity: 0.9;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.2);
      opacity: 0;
    }
  }

  @keyframes bomb-region {
    0%,
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes hammer-region {
    0% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.95);
      opacity: 0;
    }
  }

  @keyframes joker-region {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes bomb-ring {
    0% {
      width: 20px;
      height: 20px;
      opacity: 0.95;
      border-width: 8px;
    }
    100% {
      width: 280px;
      height: 280px;
      opacity: 0;
      border-width: 1px;
    }
  }

  @keyframes spark-fly {
    0% {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 1;
    }
    100% {
      transform: translate(
          calc(-50% + cos(var(--ang)) * var(--dist)),
          calc(-50% + sin(var(--ang)) * var(--dist))
        )
        scale(0.6);
      opacity: 0;
    }
  }

  @keyframes hammer-strike {
    0% {
      transform: translate(-50%, -180%) rotate(-30deg);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -30%) rotate(15deg);
      opacity: 0;
    }
  }

  @keyframes crumb-fall {
    0% {
      transform: translate(-50%, -50%) scale(0.6);
      opacity: 1;
    }
    100% {
      transform: translate(
          calc(-50% + cos(var(--ang)) * var(--dist)),
          calc(-50% + sin(var(--ang)) * var(--dist) + 40px)
        )
        scale(1)
        rotate(180deg);
      opacity: 0;
    }
  }

  @keyframes joker-glow {
    0% {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 0;
    }
    40% {
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 0.85;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.8);
      opacity: 0;
    }
  }

  @keyframes star-fly {
    0% {
      transform: translate(-50%, -50%) scale(0.3) rotate(0);
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      transform: translate(
          calc(-50% + cos(var(--ang)) * var(--dist)),
          calc(-50% + sin(var(--ang)) * var(--dist))
        )
        scale(1)
        rotate(360deg);
      opacity: 0;
    }
  }
</style>
