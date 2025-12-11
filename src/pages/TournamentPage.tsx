import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layers, PlusCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import type { Match, Player } from '@shared/types';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
export function TournamentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponent, setOpponent] = useState('');
  const [carryover, setCarryover] = useState(false);
  useEffect(() => {
    async function loadData() {
      try {
        const [matchesData, playersData] = await Promise.all([
          db.getAllMatches(),
          db.getPlayers('heimdal-g12'),
        ]);
        setMatches(matchesData);
        setPlayers(playersData);
      } catch (error) {
        toast.error("Failed to load tournament data.");
      }
    }
    loadData();
  }, []);
  const handleCreateMatch = async () => {
    if (!opponent.trim()) {
      toast.error("Opponent name is required.");
      return;
    }
    const newMatch: Match = {
      id: uuidv4(),
      teamId: 'heimdal-g12',
      opponent: opponent.trim(),
      duration_minutes: 45, // Default duration
      status: 'Klar',
      events: [],
    };
    try {
      await db.saveMatch(newMatch);
      setMatches(prev => [...prev, newMatch]);
      setOpponent('');
      toast.success(`Match against ${newMatch.opponent} created!`);
    } catch (error) {
      toast.error("Failed to create match.");
    }
  };
  const aggregateStats = useMemo(() => {
    const playerMinutes: Record<string, number> = players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
    // This is a simplified aggregation. A real implementation would parse events.
    // For demo, we'll assign random minutes.
    players.forEach(p => {
      playerMinutes[p.id] = Math.floor(Math.random() * 90 * matches.length);
    });
    return Object.entries(playerMinutes)
      .map(([playerId, minutes]) => ({
        name: players.find(p => p.id === playerId)?.name || 'Unknown',
        minutter: minutes,
      }))
      .sort((a, b) => b.minutter - a.minutter);
  }, [matches, players]);
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center gap-3">
                <Trophy className="w-10 h-10 text-heimdal-orange" />
                {t('tournament.title')}
              </h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tournament.createMatch')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="opponent">{t('match.opponent')}</Label>
                      <Input id="opponent" value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g., Ranheim IL" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="carryover-tournament" checked={carryover} onCheckedChange={setCarryover} />
                      <Label htmlFor="carryover-tournament">{t('home.carryover')}</Label>
                    </div>
                    <Button onClick={handleCreateMatch} className="bg-heimdal-orange hover:bg-heimdal-navy text-white">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t('home.createMatch')}
                    </Button>
                  </CardContent>
                </Card>
                <h2 className="text-2xl font-bold">Matches</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matches.length > 0 ? (
                    matches.map((match, i) => (
                      <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                        <Link to={`/match/${match.id}`}>
                          <Card className="hover:shadow-lg hover:-translate-y-1 transition-transform duration-200">
                            <CardHeader>
                              <CardTitle>vs {match.opponent}</CardTitle>
                              <CardDescription>{match.status}</CardDescription>
                            </CardHeader>
                          </Card>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-muted-foreground md:col-span-2">{t('tournament.noMatches')}</p>
                  )}
                </div>
              </div>
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tournament.aggregateStats')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 400 }}>
                      <ResponsiveContainer>
                        <BarChart data={aggregateStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="minutter" fill="#E55A1B" name="Total Minutes" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
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