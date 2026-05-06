# Klotz

Block-Puzzle-Spiel im 1010!-Stil als Web-PWA. Lokal, offline, ohne Tracker.

## Spielprinzip

- Quadratisches Brett (6x6, 8x8, 10x10 oder 12x12), wahlweise pro Modus
- Pro Runde drei Polyomino-Steine zur Auswahl, Refill nach drei gelegten Steinen
- Volle Reihen und Spalten loesen sich gleichzeitig auf
- Bei aufeinanderfolgenden Raumzuegen baust du eine Combo auf -- ab Combo x2 verdienst du Specials
- Spielende, sobald keiner der verbleibenden Steine mehr passt

## Modi

- **Endless** -- klassisch, Solvability-Garantie schiebt nur platzierbare Pools
- **Tages-Challenge** -- weltweit gleicher Steinverlauf pro Tag, Ranking ueber 30-Tage-Verlauf
- **Levels** -- 10 Stufen mit Hindernissen (Block + Eis), Punkt- und Zugzielen, 1-3 Sterne je nach Effizienz
- **Zeitrennen** -- 180 Sekunden, Combo zaehlt doppelt
- **Reverse** -- Brett startet voll, Ziel: 8 Linien raumen
- **Shrink** -- Brett schrumpft alle 12 Zuege

## Specials

- **Bombe** (3x3 leeren) -- ab Combo x2 oder alle 5 geraumte Linien
- **Hammer** (1 Zelle) -- ab Combo x3 oder alle 10 Linien
- **Joker** (1 freie Zelle besetzen) -- ab Combo x4 oder alle 20 Linien

Specials werden via Specials-Bar unter dem Pool ausgewaehlt und durch Klick auf eine Zelle eingesetzt.

## Steuerung

- **Drag & Drop** mit Maus oder Finger (Pointer Events, vereinheitlicht)
- **Tastatur**: Tab zwischen Pool-Slots, Pfeile zum Positionieren, Enter legt, Esc bricht ab, R rotiert (sofern erlaubt)
- **Geister-Vorschau** beim Hover, Linien-Hint hebt zu raumende Reihen/Spalten hervor

## Routing (ohne Hash)

- `/`, `/endless`, `/daily`, `/timed`, `/reverse`, `/shrink`
- `/endless/6` etc. fuer optionale Brettgroesse
- `/levels`, `/levels/level-3` direkt ins Level
- `/seed/<wert>` fuer Custom-Seed-Speedruns
- `/replay/<mode>/<seed>/<moves>` fuer geteilte Replays
- `/stats`, `/achievements`, `/replays`, `/settings`, `/help`

## Stack

- Vite + Svelte 5 (Runes, ohne SvelteKit) + TypeScript strict
- IndexedDB via `idb-keyval` fuer Spielstand, Highscores, Stats, Einstellungen
- Web-Audio fuer Sound, `navigator.vibrate` fuer Haptik
- `vite-plugin-pwa` fuer Manifest + Service-Worker (offline-faehig)
- Chakra Petch + Font Awesome lokal gebundelt

## Entwicklung

```bash
pnpm install
pnpm dev       # Dev-Server auf 5181
pnpm test      # Vitest (board, score, engine)
pnpm check     # svelte-check + tsc
pnpm build     # Production-Build inkl. Service-Worker
```

## Persistenz

Alles bleibt lokal in IndexedDB des Geraets:

- Aktuelle Endless-Partie + Resume-Prompt
- Highscore pro Modus
- Lifetime-Statistik (Spiele, Combos, Linien, Heatmap)
- Achievements-Fortschritt (24 Erfolge in Bronze/Silber/Gold)
- Letzte 25 Replays mit Seed + Zugfolge
- Einstellungen (Theme, Palette, Sound, Haptik, Brettgroesse)

Daten loeschen ueber Einstellungen > Alle Daten loeschen.

## Datenschutz

Keine externen Requests. Keine Telemetrie. Keine Werbung. Kein Backend.
