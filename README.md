# Tetris

A modern, theme-able Tetris built with React 19, TypeScript, and Vite. Implements the SRS rotation system with wall kicks, T-spin detection, 7-bag randomizer, lock delay, hold piece, and ghost piece.

## Features

- **SRS rotation** with full wall-kick tables (JLSTZ + I) and T-spin detection (3-corner rule, mini→full upgrade on kick index 4)
- **7-bag randomizer** for fair piece distribution
- **Lock delay** with 15-reset cap and pause-aware timing
- **Hold piece**, **ghost piece**, **hard drop**, **soft drop**
- **Scoring** with line clears, T-spin bonuses, and level-based gravity
- **High score persistence** via `localStorage`
- **Light / dark themes** driven entirely by CSS variables

## Controls

| Key | Action |
|---|---|
| ← → | Move left / right |
| ↓ | Soft drop |
| Space | Hard drop |
| ↑ / X | Rotate clockwise |
| Z | Rotate counter-clockwise |
| C | Hold |
| P | Pause |
| Enter | Start / restart |
| T | Cycle theme |

## Getting started

```sh
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — Type-check (`tsc -b`) then build
- `npm run lint` — `oxlint` (correctness as errors)
- `npm run preview` — Serve the production build

## Architecture

```
domain  →  store/slices  →  pages (view-model)  →  pages (view-controller) / components
```

- **`src/domain/`** — Pure game logic. No React, no DOM, no theme/color knowledge. Imported only via the `@/domain` barrel.
- **`src/store/`** — Single Zustand store composed from slices (`game`, `theme`). Wraps domain use-cases and owns side-effects.
- **`src/pages/Game/`** — MVVM (Binder pattern). `Game.view-model.ts` owns state selection, gravity / lock-delay timers, and the keyboard handler. `Game.view-controller.tsx` is purely presentational.
- **`src/components/tetris/`** — Feature components (Board, Cell, NextQueue, HoldPanel, ScorePanel, etc.).
- **`src/index.css`** — All theme tokens. Light is the default on `:root`; dark overrides under `[data-theme='dark']`.

See [`CLAUDE.md`](./CLAUDE.md) for detailed architecture notes.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind v4 · Zustand · oxlint
