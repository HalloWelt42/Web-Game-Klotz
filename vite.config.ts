import { defineConfig, type Plugin } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const base = process.env.KLOTZ_BASE ?? '/Web-Game-Klotz/'

// SPA-Fallback fuer GitHub Pages: 404.html = Kopie von index.html
function copy404(): Plugin {
  return {
    name: 'klotz-copy-404',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const src = resolve(dist, 'index.html')
      const dest = resolve(dist, '404.html')
      if (existsSync(src)) {
        copyFileSync(src, dest)
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [
    svelte(),
    copy404(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'Klotz',
        short_name: 'Klotz',
        description: 'Block-Puzzle-Spiel im 1010!-Stil -- lokal, offline, ohne Tracker.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'de',
        scope: base,
        start_url: base,
        icons: [
          {
            src: `${base}icons/icon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: false,
    // Default: nur Unit-/Spec-Tests. Diagnose-Suiten (z.B. Level-Solver,
    // braucht ~15s) liegen in *.diag.ts und laufen via `pnpm test:solver`.
    include:
      process.env.KLOTZ_TEST_DIAG === '1'
        ? ['tests/**/*.diag.ts']
        : ['tests/**/*.spec.ts'],
    testTimeout: process.env.KLOTZ_TEST_DIAG === '1' ? 30000 : 5000,
  },
})
