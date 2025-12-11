import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayerCard } from './PlayerCard';
import type { Player } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import { cn } from '@/lib/utils';
function SortablePlayerCard({ player, minutesPlayed, onSwapRequest }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlayerCard player={player} minutesPlayed={minutesPlayed} onSwapRequest={onSwapRequest} isOnField={true} />
    </div>
  );
}
export function DragDropLineup({ onFieldPlayers, onBenchPlayers, minutesPlayed, onLineupChange, teamSize }: any) {
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor));
  const onFieldIds = onFieldPlayers.map((p: Player) => p.id);
  const onBenchIds = onBenchPlayers.map((p: Player) => p.id);
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIsOnField = onFieldIds.includes(active.id);
    const overIsOnField = onFieldIds.includes(over.id);
    const activeIsOnBench = onBenchIds.includes(active.id);
    const overIsOnBench = onBenchIds.includes(over.id);
    if (activeIsOnField && overIsOnBench) {
      // Field to Bench swap
      onLineupChange(active.id, over.id);
    } else if (activeIsOnBench && overIsOnField) {
      // Bench to Field swap
      onLineupChange(over.id, active.id);
    } else if (activeIsOnBench && over.id === 'bench-droppable' && onFieldPlayers.length < teamSize) {
      // Bench to empty field spot (not a direct swap)
      // This case needs a different handler, for now we focus on swaps.
    }
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> {t('match.onField')} ({onFieldPlayers.length}/{teamSize})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[120px]">
            <SortableContext items={onFieldIds} strategy={rectSortingStrategy}>
              {onFieldPlayers.map((player: Player) => (
                <PlayerCard key={player.id} player={player} minutesPlayed={minutesPlayed[player.id] || 0} isOnField={true} onSwapRequest={() => {}} />
              ))}
            </SortableContext>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> {t('match.onBench')} ({onBenchPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 min-h-[120px]">
            <SortableContext items={onBenchIds} strategy={rectSortingStrategy}>
              {onBenchPlayers.map((player: Player) => (
                <PlayerCard key={player.id} player={player} minutesPlayed={minutesPlayed[player.id] || 0} isOnField={false} onSwapRequest={() => {}} />
              ))}
            </SortableContext>
          </CardContent>
        </Card>
      </div>
    </DndContext>
  );
}