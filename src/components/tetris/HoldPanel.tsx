import { memo } from 'react';
import type { PieceType } from '@/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiecePreview } from './PiecePreview';

interface HoldPanelProps {
  hold: PieceType | null;
  canHold: boolean;
}

export const HoldPanel = memo(function HoldPanel({
  hold,
  canHold,
}: HoldPanelProps) {
  return (
    <Card className="w-36">
      <CardHeader>
        <CardTitle>Hold</CardTitle>
      </CardHeader>
      <CardContent>
        <PiecePreview type={hold} dim={!canHold} />
      </CardContent>
    </Card>
  );
});
