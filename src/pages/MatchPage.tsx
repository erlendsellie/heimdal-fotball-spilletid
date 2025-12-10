import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Users, List, BarChart, Download, UserPlus, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MatchClock } from '@/components/MatchClock';
import { PlayerCard } from '@/components/PlayerCard';
import db from '@/lib/local-db';
import { MOCK_PLAYERS, MOCK_MATCHES } from '@shared/mock-data';
import type { Player, Match } from '@shared/types';
export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [onField, setOnField] = useState<Set<string>>(new Set());
  const [onBench, setOnBench] = useState<Set<string>>(new Set());
  const [minutesPlayed, setMinutesPlayed] = useState<Record<string, number>>({});
  useEffect(() => {
    async function loadData() {
      if (!matchId) return;
      // For demo, we use mock data. A real app would fetch from db.
      const matchData = MOCK_MATCHES.find(m => m.id === matchId) || null;
      setMatch(matchData);
      const playersData = MOCK_PLAYERS;
      setPlayers(playersData);
      // Initial setup: 7 on field, rest on bench
      const initialOnField = new Set(playersData.slice(0, 7).map(p => p.id));
      const initialOnBench = new Set(playersData.slice(7).map(p => p.id));
      setOnField(initialOnField);
      setOnBench(initialOnBench);
      const initialMinutes = playersData.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      setMinutesPlayed(initialMinutes);
    }
    loadData();
  }, [matchId]);
  const handleTick = (elapsedMs: number) => {
    const elapsedSeconds = elapsedMs / 1000;
    setMinutesPlayed(prev => {
      const newMinutes = { ...prev };
      onField.forEach(playerId => {
        // This is a simplified calculation. A robust solution would use timestamps.
        newMinutes[playerId] = (newMinutes[playerId] || 0) + (1 / 60);
      });
      return newMinutes;
    });
  };
  const handleSwap = (playerId: string) => {
    toast.info(`Substitute request for player ${playerId}. UI not fully implemented.`);
    // Full logic would involve a modal to select replacement, updating onField/onBench sets,
    // and logging the event to the oplog via db.addEvent.
  };
  const [onFieldPlayers, onBenchPlayers] = useMemo(() => {
    const field = players.filter(p => onField.has(p.id));
    const bench = players.filter(p => onBench.has(p.id));
    return [field, bench];
  }, [players, onField, onBench]);
  if (!match) {
    return (
      <div className="center h-screen">
        <p>Loading match...</p>
      </div>
    );
  }
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Live Match</h1>
              <p className="text-muted-foreground">Heimdal Fotball vs. Opponent</p>
            </div>
          </div>
          <div className="space-y-8">
            <MatchClock durationMinutes={match.duration_minutes} onTick={handleTick} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users /> On The Field ({onFieldPlayers.length})</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {onFieldPlayers.map(player => (
                      <PlayerCard 
                        key={player.id} 
                        player={player} 
                        minutesPlayed={minutesPlayed[player.id] || 0}
                        isOnField={true}
                        onSwapRequest={handleSwap}
                      />
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> On The Bench ({onBenchPlayers.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <AnimatePresence>
                      {onBenchPlayers.map(player => (
                        <PlayerCard 
                          key={player.id} 
                          player={player} 
                          minutesPlayed={minutesPlayed[player.id] || 0}
                          isOnField={false}
                          onSwapRequest={handleSwap}
                        />
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}