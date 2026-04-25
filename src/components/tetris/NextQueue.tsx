import { memo, useMemo } from 'react';
import type { PieceType } from '@/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiecePreview } from './PiecePreview';

interface NextQueueProps {
  queue: PieceType[];
}

export const NextQueue = memo(function NextQueue({ queue }: NextQueueProps) {
  const visible = useMemo(() => queue.slice(0, 3), [queue]);
  return (
    <Card className="w-36">
      <CardHeader>
        <CardTitle>Next</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {visible.map((type, i) => (
          <PiecePreview key={`${type}-${i}`} type={type} />
        ))}
      </CardContent>
    </Card>
  );
});
