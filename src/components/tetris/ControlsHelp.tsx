import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const KEYS: ReadonlyArray<readonly [string, string]> = [
  ['← →', 'Move'],
  ['↓', 'Soft'],
  ['Space', 'Drop'],
  ['↑ / X', 'Rot ↻'],
  ['Z', 'Rot ↺'],
  ['Shift', 'Hold'],
  ['P', 'Pause'],
  ['T', 'Theme'],
  ['Enter', 'Start'],
];

export const ControlsHelp = memo(function ControlsHelp() {
  return (
    <Card className="w-36">
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {KEYS.map(([key, label]) => (
          <div
            key={key}
            className="flex items-center justify-between text-[11px] text-foreground"
          >
            <kbd className="text-numeric rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] leading-none">
              {key}
            </kbd>
            <span className="text-faint">{label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
