import { motion } from 'framer-motion';
import { Shirt, ArrowRightLeft, Clock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime } from '@/lib/utils';
import type { Player } from '@shared/types';
import { useTranslation } from '@/lib/translations';
interface PlayerCardProps {
  player: Player;
  minutesPlayed: number;
  onSwapRequest: (playerId: string) => void;
  isOnField: boolean;
}
export function PlayerCard({ player, minutesPlayed, onSwapRequest, isOnField }: PlayerCardProps) {
  const { t } = useTranslation();
  const isDeficit = minutesPlayed < 0;
  const formattedTime = formatTime(Math.max(0, minutesPlayed) * 60000);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      aria-label={`Spiller: ${player.name}, Tid: ${formattedTime}`}
    >
      <Card className={cn(
        "transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1 min-h-32 flex flex-col justify-between",
        isOnField ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-card",
        isDeficit && "border-yellow-400 dark:border-yellow-700"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle className="text-lg font-bold text-pretty">{player.name}</CardTitle>
            {player.number !== undefined && player.number !== null ? (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {player.number}
              </div>
            ) : (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                -
              </div>
            )}
        </CardHeader>
        <CardContent className="p-4 pt-0 pb-2 space-y-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Shirt className="mr-1.5 h-4 w-4" />
              <span>{t(`positions.${player.position.toLowerCase()}`)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1.5 h-4 w-4" />
              <span className="text-lg font-mono font-bold text-foreground">{formattedTime}</span>
            </div>
          </div>
          {isDeficit && (
            <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
              <TrendingDown className="mr-1.5 h-4 w-4" />
              <span>{t('match.deficitDisplay', { min: formatTime(minutesPlayed * 60000) })}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          {isOnField ? (
            <Badge variant="outline" className="border-green-500 text-green-600">On Field</Badge>
          ) : (
            <Badge variant="secondary">On Bench</Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => onSwapRequest(player.id)} className="h-9">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Substitute
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}