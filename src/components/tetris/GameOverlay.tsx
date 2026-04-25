import { memo } from 'react';
import type { GameStatus } from '@/domain';
import { Button } from '@/components/ui/button';

interface GameOverlayProps {
  status: GameStatus;
  score: number;
  highScore: number;
  onStart: () => void;
  onResume: () => void;
}

export const GameOverlay = memo(function GameOverlay({
  status,
  score,
  highScore,
  onStart,
  onResume,
}: GameOverlayProps) {
  if (status === 'running') return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-page)]/85 backdrop-blur-[2px]">
      <div className="flex w-full max-w-[88%] flex-col items-center gap-4 px-4 py-6 text-center">
        {status === 'idle' && (
          <>
            <h2 className="text-display text-4xl">Tetris</h2>
            <p className="text-label text-[10px]">
              Press Enter or click below
            </p>
            <Button onClick={onStart}>Start game</Button>
          </>
        )}
        {status === 'paused' && (
          <>
            <h2 className="text-display text-4xl">Paused</h2>
            <p className="text-label text-[10px]">Press P to resume</p>
            <Button onClick={onResume}>Resume</Button>
          </>
        )}
        {status === 'gameover' && (
          <>
            <h2 className="text-display text-4xl">Game over</h2>
            <div className="flex flex-col gap-1">
              <span className="text-label text-[10px]">Final score</span>
              <span className="text-numeric text-5xl font-bold leading-none text-foreground">
                {score.toLocaleString()}
              </span>
              {score >= highScore && score > 0 && (
                <span className="text-label mt-1 text-[10px] text-[var(--accent)]">
                  New high score
                </span>
              )}
            </div>
            <Button onClick={onStart}>Play again</Button>
          </>
        )}
      </div>
    </div>
  );
});
