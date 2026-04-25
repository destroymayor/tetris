import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScorePanelProps {
  score: number;
  level: number;
  lines: number;
  highScore: number;
}

export const ScorePanel = memo(function ScorePanel({
  score,
  level,
  lines,
  highScore,
}: ScorePanelProps) {
  return (
    <Card className="w-36">
      <CardHeader>
        <CardTitle>Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Row label="Score" value={score.toLocaleString()} highlight />
        <Row label="High" value={highScore.toLocaleString()} />
        <Row label="Lines" value={lines.toLocaleString()} />
        <Row label="Level" value={level.toLocaleString()} />
      </CardContent>
    </Card>
  );
});

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-label text-[9px]">{label}</span>
      <span
        className={
          highlight
            ? 'text-numeric text-2xl font-bold leading-none text-foreground'
            : 'text-numeric text-base leading-none text-foreground'
        }
      >
        {value}
      </span>
    </div>
  );
}
