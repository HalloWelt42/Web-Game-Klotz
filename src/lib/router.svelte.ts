import { LEVELS } from './game/levels';
import type { BoardSize, GameMode, ReplayMove } from './game/types';
import { pieceById } from './game/pieces';

const RAW_BASE =
  typeof import.meta !== 'undefined'
    ? (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
    : '/';
export const BASE_PATH = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;

export function withBase(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return BASE_PATH + clean;
}

function stripBase(pathname: string): string {
  if (BASE_PATH === '/') return pathname;
  if (pathname.startsWith(BASE_PATH)) {
    const rest = pathname.slice(BASE_PATH.length);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return pathname;
}

export type Route =
  | { kind: 'home' }
  | { kind: 'mode'; mode: GameMode; size?: BoardSize }
  | { kind: 'levels' }
  | { kind: 'level'; id: string }
  | { kind: 'seed'; seed: number; raw: string; size?: BoardSize }
  | { kind: 'replay'; mode: GameMode; seed: number; moves: ReplayMove[] }
  | { kind: 'stats' }
  | { kind: 'achievements' }
  | { kind: 'replays' }
  | { kind: 'settings' }
  | { kind: 'help' }
  | { kind: 'donate' }
  | { kind: 'new-game' };

const VALID_SIZES: BoardSize[] = [6, 8, 10, 12];

function parseSize(raw: string): BoardSize | undefined {
  const n = parseInt(raw, 10);
  return (VALID_SIZES as number[]).includes(n) ? (n as BoardSize) : undefined;
}

const MODE_PATHS: Record<GameMode, string> = {
  endless: '/endless',
  daily: '/daily',
  level: '/levels',
  timed: '/timed',
  reverse: '/reverse',
  shrink: '/shrink',
};

const PATH_TO_MODE: Record<string, GameMode> = {
  '/endless': 'endless',
  '/daily': 'daily',
  '/timed': 'timed',
  '/reverse': 'reverse',
  '/shrink': 'shrink',
};

function parseSeedString(raw: string): number {
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10) >>> 0;
  let h = 2166136261;
  for (let i = 0; i < trimmed.length; i++) {
    h ^= trimmed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function parseRoute(pathname: string): Route {
  const stripped = stripBase(pathname);
  const path = stripped.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '') return { kind: 'home' };
  if (path === '/levels') return { kind: 'levels' };
  if (path === '/stats') return { kind: 'stats' };
  if (path === '/achievements') return { kind: 'achievements' };
  if (path === '/replays') return { kind: 'replays' };
  if (path === '/settings') return { kind: 'settings' };
  if (path === '/help') return { kind: 'help' };
  if (path === '/danke' || path === '/donate') return { kind: 'donate' };
  if (path === '/neue-partie' || path === '/new-game') return { kind: 'new-game' };

  if (path in PATH_TO_MODE) {
    return { kind: 'mode', mode: PATH_TO_MODE[path] };
  }

  const modeSizeMatch = path.match(/^(\/[a-z]+)\/(\d+)$/);
  if (modeSizeMatch && modeSizeMatch[1] in PATH_TO_MODE) {
    const size = parseSize(modeSizeMatch[2]);
    if (size) {
      return { kind: 'mode', mode: PATH_TO_MODE[modeSizeMatch[1]], size };
    }
  }

  const levelMatch = path.match(/^\/levels\/([a-z0-9-]+)$/i);
  if (levelMatch) {
    const id = levelMatch[1];
    if (LEVELS.some((l) => l.id === id)) return { kind: 'level', id };
    return { kind: 'levels' };
  }

  const seedMatch = path.match(/^\/seed\/([^/]+)(?:\/(\d+))?$/);
  if (seedMatch) {
    const raw = decodeURIComponent(seedMatch[1]);
    const size = seedMatch[2] ? parseSize(seedMatch[2]) : undefined;
    return { kind: 'seed', seed: parseSeedString(raw), raw, size };
  }

  const replayMatch = path.match(/^\/replay\/([a-z]+)\/(\d+)\/?(.*)$/);
  if (replayMatch) {
    const mode = replayMatch[1] as GameMode;
    if (mode in MODE_PATHS) {
      const seed = parseInt(replayMatch[2], 10) >>> 0;
      const movesRaw = replayMatch[3] ? decodeURIComponent(replayMatch[3]) : '';
      const moves: ReplayMove[] = [];
      for (const part of movesRaw.split(',').filter(Boolean)) {
        const [s, id, x, y] = part.split(':');
        const slot = parseInt(s, 10);
        if (slot < 0 || slot > 2) continue;
        if (!pieceById(id)) continue;
        moves.push({
          slot: slot as 0 | 1 | 2,
          pieceId: id,
          x: parseInt(x, 10),
          y: parseInt(y, 10),
        });
      }
      return { kind: 'replay', mode, seed, moves };
    }
  }

  return { kind: 'home' };
}

export function routeToPath(route: Route): string {
  switch (route.kind) {
    case 'home':
      return '/';
    case 'mode':
      // Wenn explizit size übergeben wurde, immer als Suffix in die URL --
      // sonst würde ein Wechsel von 8x8 auf 10x10 als gleiche URL landen
      // und beim Click auf die Modi-Kachel still verschluckt werden.
      return route.size
        ? `${MODE_PATHS[route.mode]}/${route.size}`
        : MODE_PATHS[route.mode];
    case 'levels':
      return '/levels';
    case 'level':
      return `/levels/${route.id}`;
    case 'seed':
      return route.size
        ? `/seed/${encodeURIComponent(route.raw)}/${route.size}`
        : `/seed/${encodeURIComponent(route.raw)}`;
    case 'replay': {
      const moves = route.moves
        .map((m) => `${m.slot}:${m.pieceId}:${m.x}:${m.y}`)
        .join(',');
      return `/replay/${route.mode}/${route.seed}/${encodeURIComponent(moves)}`;
    }
    case 'stats':
      return '/stats';
    case 'achievements':
      return '/achievements';
    case 'replays':
      return '/replays';
    case 'settings':
      return '/settings';
    case 'help':
      return '/help';
    case 'donate':
      return '/danke';
    case 'new-game':
      return '/neue-partie';
  }
}

function createRouter() {
  let pathname = $state('/');
  let route = $state<Route>({ kind: 'home' });

  function refresh() {
    pathname = window.location.pathname;
    route = parseRoute(pathname);
  }

  function init() {
    refresh();
    window.addEventListener('popstate', refresh);
  }

  function navigate(target: Route, opts: { replace?: boolean } = {}) {
    const logicalPath = routeToPath(target);
    const fullPath = withBase(logicalPath);
    if (fullPath === pathname) {
      route = target;
      return;
    }
    if (opts.replace) {
      window.history.replaceState({}, '', fullPath);
    } else {
      window.history.pushState({}, '', fullPath);
    }
    pathname = fullPath;
    route = target;
  }

  return {
    get pathname() {
      return pathname;
    },
    get route() {
      return route;
    },
    init,
    navigate,
    refresh,
  };
}

export const router = createRouter();
