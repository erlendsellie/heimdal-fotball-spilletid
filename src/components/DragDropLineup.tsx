import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayerCard } from './PlayerCard';
import type { Player } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
function SortablePlayerCard({ player, minutesPlayed, isOnField, onSwapRequest }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlayerCard player={player} minutesPlayed={minutesPlayed} isOnField={isOnField} onSwapRequest={onSwapRequest} />
    </div>
  );
}
export function DragDropLineup({ onFieldPlayers, onBenchPlayers, minutesPlayed, onSwapRequest, onLineupChange }: any) {
  const sensors = useSensors(useSensor(PointerSensor));
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      onLineupChange(active.id, over.id);
    }
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> On The Field ({onFieldPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <SortableContext items={onFieldPlayers.map((p: Player) => p.id)} strategy={verticalListSortingStrategy}>
              {onFieldPlayers.map((player: Player) => (
                <SortablePlayerCard key={player.id} player={player} minutesPlayed={minutesPlayed[player.id] || 0} isOnField={true} onSwapRequest={onSwapRequest} />
              ))}
            </SortableContext>
          </CardContent>
        </Card>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> On The Bench ({onBenchPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <SortableContext items={onBenchPlayers.map((p: Player) => p.id)} strategy={verticalListSortingStrategy}>
                {onBenchPlayers.map((player: Player) => (
                  <SortablePlayerCard key={player.id} player={player} minutesPlayed={minutesPlayed[player.id] || 0} isOnField={false} onSwapRequest={onSwapRequest} />
                ))}
              </SortableContext>
            </CardContent>
          </Card>
        </div>
      </div>
    </DndContext>
  );
}