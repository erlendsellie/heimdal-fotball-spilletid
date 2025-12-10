import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMachine } from '@xstate/react';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MatchClock } from '@/components/MatchClock';
import { DragDropLineup } from '@/components/DragDropLineup';
import { MOCK_PLAYERS, MOCK_MATCHES } from '@shared/mock-data';
import type { Player, Match } from '@shared/types';
import { matchMachine } from '@/lib/matchMachine';
import { suggestSwaps } from '@/lib/substitutionSuggestions';
import { runSync } from '@/lib/sync';
import { Navigation } from '@/components/Navigation';
export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [minutesPlayed, setMinutesPlayed] = useState<Record<string, number>>({});
  const [current, send] = useMachine(matchMachine);
  useEffect(() => {
    async function loadData() {
      if (!matchId) return;
      const matchData = MOCK_MATCHES.find(m => m.id === matchId) || null;
      setMatch(matchData);
      const playersData = MOCK_PLAYERS;
      setPlayers(playersData);
      const initialOnField = new Set(playersData.slice(0, 7).map(p => p.id));
      const initialOnBench = new Set(playersData.slice(7).map(p => p.id));
      send({
        type: 'RESET',
        context: {
            onField: initialOnField,
            onBench: initialOnBench,
            players: playersData,
            durationMs: (matchData?.duration_minutes || 45) * 60 * 1000,
        }
      });
      const initialMinutes = playersData.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      setMinutesPlayed(initialMinutes);
    }
    loadData();
  }, [matchId, send]);
  const handleTick = useCallback(() => {
    setMinutesPlayed(prev => {
      const newMinutes = { ...prev };
      if (current?.context?.onField) {
        current.context.onField.forEach((playerId: string) => {
          newMinutes[playerId] = (newMinutes[playerId] || 0) + (1 / 60);
        });
      }
      return newMinutes;
    });
  }, [current]);
  const handleSwapRequest = (playerId: string) => {
    toast.info(`Bytteforespørsel for spiller ${playerId}. Bruk dra-og-slipp eller forslag.`);
  };
  const handleLineupChange = (activeId: string, overId: string) => {
    const playerOutId = activeId;
    const playerInId = overId;
    send({ type: 'SUBSTITUTE', playerOutId, playerInId });
    toast.success('Bytte utført!');
  };
  const [onFieldPlayers, onBenchPlayers] = useMemo(() => {
    const onField = current?.context?.onField ?? new Set();
    const onBench = current?.context?.onBench ?? new Set();
    const field = players.filter(p => onField.has(p.id));
    const bench = players.filter(p => onBench.has(p.id));
    return [field, bench];
  }, [players, current]);
  const suggestions = useMemo(() => suggestSwaps(onFieldPlayers, onBenchPlayers, minutesPlayed, 'even'), [onFieldPlayers, onBenchPlayers, minutesPlayed]);
  const isRunning = useMemo(() => current.matches('running'), [current]);
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      runSync();
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning]);
  if (!match) return <div className="center h-screen"><p>Laster kamp...</p></div>;
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Live Kamp</h1>
                <p className="text-muted-foreground">{match.teamId} mot {match.opponent}</p>
              </div>
            </div>
            <div className="space-y-8">
              <MatchClock durationMinutes={match.duration_minutes} onTick={handleTick} onStatusChange={(status) => {
                if (status === 'running' && !current.matches('running')) send({ type: 'START' });
                if (status === 'paused') send({ type: 'PAUSE' });
                if (status === 'stopped') send({ type: 'STOP' });
              }} />
              <DragDropLineup
                onFieldPlayers={onFieldPlayers}
                onBenchPlayers={onBenchPlayers}
                minutesPlayed={minutesPlayed}
                onSwapRequest={handleSwapRequest}
                onLineupChange={handleLineupChange}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lightbulb /> Bytteforslag</CardTitle>
                </CardHeader>
                <CardContent>
                  {suggestions.length > 0 ? (
                    <ul className="space-y-2">
                      {suggestions.map((s, i) => (
                        <li key={i} className="text-sm p-2 border rounded-md flex justify-between items-center">
                          <span><strong>Ut:</strong> {s.out.name}, <strong>Inn:</strong> {s.in.name} ({s.reason})</span>
                          <Button size="sm" className="bg-heimdal-red hover:bg-heimdal-red/90 text-white" onClick={() => handleLineupChange(s.out.id, s.in.id)}>Utfør</Button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">Ingen forslag tilgjengelig.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}