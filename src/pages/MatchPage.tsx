import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalMatchMachine } from '@/lib/matchMachine';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MatchClock } from '@/components/MatchClock';
import { DragDropLineup } from '@/components/DragDropLineup';
import type { Player, Match } from '@shared/types';

import { suggestSwaps } from '@/lib/substitutionSuggestions';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
export function MatchPage() {
  const { t } = useTranslation();
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Partial<Match> & { teamSize: number; carryover: boolean } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [minutesPlayed, setMinutesPlayed] = useState<Record<string, number>>({});
  const [current, send] = useLocalMatchMachine();
  useEffect(() => {
    async function loadData() {
      if (!matchId) return;
      const matchConfig = await db.getMeta('newMatchConfig');
      if (!matchConfig || matchConfig.id !== matchId) {
        toast.error("Match configuration not found.");
        navigate('/');
        return;
      }
      setMatch({
        id: matchId,
        duration_minutes: matchConfig.duration,
        teamSize: matchConfig.teamSize,
        carryover: matchConfig.carryover,
        opponent: matchConfig.opponent,
        status: 'Klar',
        teamId: 'heimdal-g12'
      });
      const playersData = await db.getPlayers('heimdal-g12');
      setPlayers(playersData);
      let initialMinutes = playersData.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      if (matchConfig.carryover) {
        const prevMinutes = await db.getPreviousMinutes();
        const totalMinutes = Object.values(prevMinutes).reduce((a, b) => a + b, 0);
        const avgMinutes = playersData.length > 0 ? totalMinutes / playersData.length : 0;
        initialMinutes = playersData.reduce((acc, p) => {
          const pMins = prevMinutes[p.id] || 0;
          const deficit = pMins < avgMinutes ? Math.round((pMins - avgMinutes) / 2) : 0;
          return { ...acc, [p.id]: deficit };
        }, {});
      }
      setMinutesPlayed(initialMinutes);
      const initialOnField = new Set(playersData.slice(0, matchConfig.teamSize).map(p => p.id));
      const initialOnBench = new Set(playersData.slice(matchConfig.teamSize).map(p => p.id));
      send({
        type: 'RESET',
        context: {
          onField: initialOnField,
          onBench: initialOnBench,
          players: playersData,
          durationMs: (matchConfig.duration || 45) * 60 * 1000,
        }
      });
      await db.setMeta('newMatchConfig', null);
    }
    loadData();
  }, [matchId, send, navigate]);
  const handleTick = useCallback((elapsedMs: number) => {
    const deltaSeconds = 1; // Assuming tick is called every second
    setMinutesPlayed(prev => {
      const newMinutes = { ...prev };
      (current.context?.onField ?? new Set()).forEach((playerId: string) => {
        newMinutes[playerId] = (newMinutes[playerId] || 0) + (deltaSeconds / 60);
      });
      return newMinutes;
    });
  }, [current.context?.onField]);
  const handleLineupChange = (playerOutId: string, playerInId: string) => {
    send({ type: 'SUBSTITUTE', playerOutId, playerInId });
    db.addEvent({
      type: 'SUBSTITUTION',
      matchId: matchId!,
      payload: { playerOutId, playerInId, minute: (current.context?.elapsedMs || 0) / 60000 }
    });
    toast.success(t('match.substitutionMade'));
  };
  const [onFieldPlayers, onBenchPlayers] = useMemo(() => {
    const onFieldSet = current.context?.onField ?? new Set();
    const onBenchSet = current.context?.onBench ?? new Set();
    const onField = players.filter(p => onFieldSet.has(p.id));
    const onBench = players.filter(p => onBenchSet.has(p.id));
    return [onField, onBench];
  }, [players, current.context?.onField, current.context?.onBench]);
  const suggestions = useMemo(() => suggestSwaps(onFieldPlayers, onBenchPlayers, minutesPlayed, 'even'), [onFieldPlayers, onBenchPlayers, minutesPlayed]);
  if (!match) {
    return (
      <div className="center h-screen"><p aria-live="polite">{t('match.loading')}</p></div>
    );
  }
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" size="icon" onClick={() => navigate('/')} aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('match.liveTitle')}</h1>
                <p className="text-muted-foreground">{t('match.teamSizeDisplay', { size: match.teamSize })}</p>
              </div>
            </div>
            <div className="space-y-8">
              <MatchClock durationMinutes={match.duration_minutes || 45} onTick={handleTick} onStatusChange={(status) => {
                if (status === 'running' && !current.matches('running')) {
                  send({ type: 'START' });
                  db.addEvent({ type: 'START', matchId: matchId!, payload: { initialLineup: Array.from(current.context?.onField ?? new Set()) } });
                }
                if (status === 'paused') send({ type: 'PAUSE' });
                if (status === 'stopped') {
                  send({ type: 'STOP' });
                  db.setMeta('lastSessionMinutes', minutesPlayed);
                }
              }} />
              <DragDropLineup
                onFieldPlayers={onFieldPlayers}
                onBenchPlayers={onBenchPlayers}
                minutesPlayed={minutesPlayed}
                onLineupChange={handleLineupChange}
                teamSize={match.teamSize}
              />
              <Card className="bg-gradient-to-r from-heimdal-orange/5 to-heimdal-navy/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lightbulb /> {t('match.suggestionsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {suggestions.length > 0 ? (
                    <ul className="space-y-2">
                      {suggestions.map((s, i) => (
                        <li key={i} className="text-sm p-2 border rounded-md flex justify-between items-center bg-background/50">
                          <span><strong>Ut:</strong> {s.out.name}, <strong>Inn:</strong> {s.in.name} ({s.reason})</span>
                          <Button size="sm" className="bg-heimdal-orange hover:bg-heimdal-navy text-white focus:ring-heimdal-orange" onClick={() => handleLineupChange(s.out.id, s.in.id)}>{t('match.substitute')}</Button>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-muted-foreground">{t('match.noSuggestions')}</p>}
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