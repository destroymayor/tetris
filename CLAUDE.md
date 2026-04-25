# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (default http://localhost:5173)
- `npm run build` — Type-check (`tsc -b`) then `vite build`. Type errors fail the build.
- `npm run lint` — `oxlint` with `correctness` category as errors; plugins: typescript, react, react-perf
- `npm run preview` — Serve the production build

There is no test runner configured. Don't invent one.

## High-level architecture

Single-page React 19 + TypeScript + Vite app. One screen (`Game`), one Zustand store, one CSS file driving five themes via CSS variables. Path alias `@/*` → `src/*`.

### Layer boundaries (strict)

```
domain  →  store/slices  →  pages (view-model)  →  pages (view-controller) / components
```

- **`src/domain/`** — pure game logic. No React, no DOM, no theme/color knowledge. `PieceType` is the identity ('I' | 'O' | …); visual mapping lives in CSS only.
- **`src/domain/index.ts`** is a **gatekeeper barrel**. Anything outside `src/domain/` MUST import domain types/functions from `@/domain` only — never reach into `@/domain/services/...` or `@/domain/constants/...` directly. When adding domain capabilities, re-export them from this barrel.
- **`src/store/`** — single Zustand store composed from slices (`game.slice.ts`, `theme.slice.ts`). Slices wrap pure domain use-cases and own side-effects (localStorage persistence for high score and theme, applying `data-theme` to `<html>`).
- **`src/pages/Game/`** — MVVM (Binder pattern):
  - `Game.view-model.ts` — `useGameViewModel()` hook. Selects store slices, runs gravity (`setInterval`) and lock-delay (`setTimeout`) effects, owns keyboard handler, derives `cells` grid (board + active + ghost) for rendering.
  - `Game.view-controller.tsx` — pure presentational component. Receives the view-model's return value as props.
  - `index.ts` — wires them via `bind(ViewController, useViewModel)` from `src/utils/bind.tsx`.
- **`src/components/tetris/`** — feature components (Board, Cell, NextQueue, HoldPanel, ScorePanel, GameOverlay, TSpinBanner, ControlsHelp, PiecePreview). Presentational; receive everything as props.
- **`src/components/ui/`** — generic primitives (button, card) styled against the token system.

### Game logic (pure, in `src/domain/services/tetris/`)

- `board.ts` — `createEmptyBoard`, `isCollision`, `lockPiece`, `clearLines`
- `piece.ts` — `spawnPiece`, `tryMove`, `tryRotate` (returns `{ piece, kickIndex }`), `hardDropDistance`, `ghostPosition`
- `bag.ts` — 7-bag randomizer (`createBag`, `refillIfNeeded`, `takeNext`)
- `scoring.ts` — `computeLineScore` (incl. T-spin tables), `levelFromLines`, `gravityIntervalMs`
- `tspin.ts` — SRS T-spin detection (3-corner rule + kick-index 4 mini→full upgrade)
- `tick.usecase.ts` — orchestration: `spawnNext`, `lockAndAdvance`, `noteAction`, `advanceTickUsecase`, `forceLockUsecase`, `hardDropUsecase`. Each is a pure `(GameStateDto) → GameStateDto` (or `{ state, … }`).
- Constants: `board.ts` (10×20), `tetrominoes.ts` (SRS shapes per rotation, spawn offsets), `kicks.ts` (SRS wall kicks for JLSTZ and I), `lockDelay.ts` (500 ms, max 15 resets), `scoring.ts` (line scores, gravity table, soft/hard drop points).

When changing game rules, change the pure function in `src/domain/services/tetris/`. The slice already calls it; no slice change needed unless you're adding a new action.

### Lock-delay model (subtle)

`lockDelay: { groundedAt, resets, pausedElapsedMs }` lives on `GameStateDto`. When the active piece is grounded, `groundedAt` is the timestamp it grounded. Each successful move/rotate while grounded calls `noteAction` which bumps `groundedAt = now` and increments `resets` (capped at `MAX_LOCK_RESETS = 15`). The view-model schedules a single `setTimeout(forceLock, 500 - (now - groundedAt))` keyed on `groundedAt` — when `groundedAt` mutates, React tears down the old timer and schedules a fresh one. Pause snapshots elapsed time into `pausedElapsedMs` so resume continues mid-window. Don't re-implement this with intervals.

### Theming system

Two themes — `light` (default) and `dark`. The light tokens live on `:root`; `[data-theme='dark']` overrides them. The active theme is set by `document.documentElement.dataset.theme` from the theme slice.

- All theme values live in `src/index.css` as CSS variables.
- Tailwind v4 `@theme` block aliases token CSS vars to Tailwind utility colors so utilities like `bg-foreground` resolve through tokens.
- Components MUST reference tokens (`var(--accent)`, `bg-foreground`, semantic class names like `cell`, `board`, `theme-chip`), never hard-code colors. Cell visuals come from `data-piece` / `data-ghost` attributes.
- New visual decisions ⇒ add tokens in `:root` (and override in `[data-theme='dark']` if needed). Do not introduce per-component theme switches in TSX.

### Persistence

- `localStorage['tetris.highScore']` — written from the game slice on score updates and game-over.
- `localStorage['tetris.theme']` — written by `setTheme` / `cycleTheme`.

Both are read on store initialization. Failures are swallowed.

### Keyboard

All key handling is centralized in `Game.view-model.ts` except theme cycling (`T`), which lives in `ThemeSwitcher.tsx`. Game keys: arrows (move/soft-drop), space (hard drop), `x`/Up (CW), `z` (CCW), `c` (hold), `p` (pause), Enter (start/restart). Auto-repeat is suppressed for space / Enter / `c` / `p`.

## Conventions

- Path alias: import internal modules as `@/...` (configured in `vite.config.ts` and `tsconfig.app.json`).
- Strict TS flags on: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`. Use `import type` for type-only imports.
- Don't import from `src/domain/services/...` or `src/domain/constants/...` outside the domain layer. Add a re-export to `src/domain/index.ts` instead.
- `src/lib/utils.ts` exports `cn(...)` (clsx + tailwind-merge) for className composition.
