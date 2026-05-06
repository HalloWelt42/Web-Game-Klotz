import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'docs/screenshots');

const CHROME =
  '/Users/alpha/.cache/puppeteer/chrome/mac_arm-146.0.7680.153/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const BASE = 'http://localhost:5181/Web-Game-Klotz';

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

async function shoot(page, path) {
  await page.screenshot({ path, omitBackground: false, type: 'png' });
  console.log('->', path);
}

async function settle(page, ms = 600) {
  await new Promise((r) => setTimeout(r, ms));
}

(async () => {
  await mkdir(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    defaultViewport: VIEWPORT,
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

  // Saubere IndexedDB / LocalStorage Pre-Seed
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('klotz:tutorial-shown', '1');
    return new Promise((resolve) => {
      const open = indexedDB.open('klotz-db');
      open.onupgradeneeded = () => {
        open.result.createObjectStore('klotz-store');
      };
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('klotz-store', 'readwrite');
        // Alle Modi als bereits gesehen markieren -- keine Modus-Hinweise
        tx.objectStore('klotz-store').put(
          {
            theme: 'system',
            palette: 'default',
            colorblind: false,
            sound: false,
            haptics: false,
            boardSize: 10,
            modeHintsShown: ['endless', 'daily', 'level', 'timed', 'reverse', 'shrink'],
          },
          'klotz:settings',
        );
        tx.oncomplete = () => resolve();
      };
    });
  });

  // 1) Hauptmenue
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await settle(page, 700);
  await shoot(page, resolve(OUT, '01-menu.png'));

  // 2) Aktive Reverse-Partie -- Brett startet gefuellt, sieht eindrucksvoll aus
  await page.goto(`${BASE}/reverse`, { waitUntil: 'networkidle0' });
  await settle(page, 1200);
  await shoot(page, resolve(OUT, '02-game.png'));

  // 3) Tages-Challenge mit Modus-Hinweis-Page (eigene Page-Layout)
  // Stattdessen Statistik-Seite -- inhaltsreicher mit Heatmap und Modi
  await page.evaluate(() => {
    const fakeStats = {
      gamesPlayed: 12,
      totalPoints: 4380,
      highestCombo: 5,
      longestStreak: 6,
      rowsCleared: 24,
      colsCleared: 19,
      heatmap: Array.from({ length: 10 }, (_, y) =>
        Array.from({ length: 10 }, (_, x) => Math.max(0, 8 - Math.abs(x - 4) - Math.abs(y - 4))),
      ),
      perGameHigh: { endless: 920, daily: 540, level: 250, timed: 410, reverse: 180, shrink: 220 },
      achievements: ['first-place', 'first-clear', 'combo-3', 'combo-5', 'score-500'],
      dailyScores: [
        { date: '2026-05-06', score: 540 },
        { date: '2026-05-05', score: 460 },
        { date: '2026-05-04', score: 380 },
        { date: '2026-05-03', score: 510 },
        { date: '2026-05-02', score: 420 },
        { date: '2026-05-01', score: 360 },
      ],
      completedLevels: ['level-1', 'level-2'],
      levelStars: { 'level-1': 3, 'level-2': 2 },
    };
    return new Promise((resolve) => {
      const open = indexedDB.open('klotz-db');
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('klotz-store', 'readwrite');
        tx.objectStore('klotz-store').put(fakeStats, 'klotz:stats');
        tx.oncomplete = () => resolve();
      };
    });
  });
  await page.goto(`${BASE}/stats`, { waitUntil: 'networkidle0' });
  await settle(page, 900);
  await shoot(page, resolve(OUT, '03-stats.png'));

  await browser.close();
  console.log('Fertig. Bilder in', OUT);
})();
