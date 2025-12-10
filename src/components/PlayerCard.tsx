import { motion } from 'framer-motion';
import { Shirt, ArrowRightLeft, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Player } from '@shared/types';
interface PlayerCardProps {
  player: Player;
  minutesPlayed: number;
  onSwapRequest: (playerId: string) => void;
  isOnField: boolean;
}
const formatMinutes = (minutes: number) => Math.floor(minutes);
export function PlayerCard({ player, minutesPlayed, onSwapRequest, isOnField }: PlayerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className={cn(
        "transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1",
        isOnField ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-card"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold text-pretty">{player.name}</CardTitle>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {player.number}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Shirt className="mr-1.5 h-4 w-4" />
              <span>{player.position}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1.5 h-4 w-4" />
              <span>{formatMinutes(minutesPlayed)} min</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          {isOnField ? (
            <Badge variant="outline" className="border-green-500 text-green-600">On Field</Badge>
          ) : (
            <Badge variant="secondary">On Bench</Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => onSwapRequest(player.id)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Substitute
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}