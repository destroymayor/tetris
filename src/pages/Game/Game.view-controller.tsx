import { Board } from '@/components/tetris/Board';
import { ComboBanner } from '@/components/tetris/ComboBanner';
import { ControlsHelp } from '@/components/tetris/ControlsHelp';
import { GameOverlay } from '@/components/tetris/GameOverlay';
import { HoldPanel } from '@/components/tetris/HoldPanel';
import { NextQueue } from '@/components/tetris/NextQueue';
import { ScorePanel } from '@/components/tetris/ScorePanel';
import { TSpinBanner } from '@/components/tetris/TSpinBanner';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import type { IGameViewModel } from './Game.view-model';

export function Game(props: IGameViewModel) {
  const {
    cells,
    hold,
    canHold,
    queue,
    score,
    level,
    lines,
    highScore,
    status,
    clearPulse,
    clearAmount,
    tspinPulse,
    tspinPayload,
    combo,
    comboPulse,
    onStart,
    onResume,
  } = props;

  return (
    <main className="relative flex min-h-full w-full items-center justify-center px-6 py-8">
      <div className="flex w-full max-w-6xl flex-col items-center gap-6">
        <header className="flex w-full flex-wrap items-end justify-between gap-x-12 gap-y-5 border-b border-[var(--border)] pb-5">
          <h1 className="wordmark text-display text-foreground">Tetris</h1>
          <ThemeSwitcher />
        </header>

        <div className="flex w-full items-start justify-center gap-5">
          <aside className="flex flex-col gap-3">
            <HoldPanel hold={hold} canHold={canHold} />
            <ControlsHelp />
          </aside>

          <div className="relative">
            <Board cells={cells} className="h-[min(86vh,860px)] aspect-[1/2]" />
            {clearPulse > 0 && (
              <div
                key={clearPulse}
                className="board-flash pointer-events-none absolute inset-0 z-[5]"
                data-amount={clearAmount}
              />
            )}
            <GameOverlay
              status={status}
              score={score}
              highScore={highScore}
              onStart={onStart}
              onResume={onResume}
            />
          </div>

          <aside className="flex flex-col gap-3">
            <NextQueue queue={queue} />
            <TSpinBanner
              pulse={tspinPulse}
              kind={tspinPayload.kind}
              lines={tspinPayload.lines}
            />
            <ComboBanner pulse={comboPulse} combo={combo} />
            <ScorePanel
              score={score}
              level={level}
              lines={lines}
              highScore={highScore}
              combo={combo}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
