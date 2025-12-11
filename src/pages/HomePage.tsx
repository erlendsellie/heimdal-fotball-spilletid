import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import type { Player } from '@shared/types';
const calculateDeficits = (players: Player[], prevMinutes: Record<string, number>): Record<string, number> => {
  if (Object.keys(prevMinutes).length === 0) return {};
  const totalMinutes = Object.values(prevMinutes).reduce((a, b) => a + b, 0);
  const avgMinutes = players.length > 0 ? totalMinutes / players.length : 0;
  const deficits: Record<string, number> = {};
  players.forEach(p => {
    const pMins = prevMinutes[p.id] || 0;
    if (pMins < avgMinutes) {
      deficits[p.id] = Math.round(pMins - avgMinutes);
    }
  });
  return deficits;
};
export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState(7);
  const [duration, setDuration] = useState(45);
  const [carryover, setCarryover] = useState(false);
  useEffect(() => {
    const loadPlayers = async () => {
      const playersData = await db.getPlayers('heimdal-g12');
      setPlayers(playersData);
      setSelectedPlayerIds(playersData.slice(0, teamSize).map(p => p.id));
    };
    loadPlayers();
  }, [teamSize]);
  const handleStartMatch = async () => {
    if (duration < 1 || duration > 120) {
      toast.error('Duration must be between 1 and 120 minutes.');
      return;
    }
    if (selectedPlayerIds.length < teamSize) {
      toast.error(t('home.lineupSelect', { size: teamSize }));
      return;
    }
    const matchId = uuidv4();
    const deficits = carryover ? calculateDeficits(players, await db.getPreviousMinutes()) : {};
    const matchConfig = {
      id: matchId,
      teamSize,
      duration,
      carryover,
      lineup: selectedPlayerIds.slice(0, teamSize),
      deficits,
    };
    await db.setMeta('newMatchConfig', matchConfig);
    navigate(`/match/${matchId}`);
  };
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 md:py-24 lg:py-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <img src="https://via.placeholder.com/192x192/E55A1B/FFFFFF?text=Heimdal" className="mx-auto h-20 w-20 mb-4 rounded-full bg-heimdal-orange shadow-lg" alt="Heimdal Fotball Logo" />
                <div className="relative inline-block">
                  <div className="absolute -inset-2 bg-gradient-to-r from-heimdal-orange to-heimdal-navy rounded-full blur-xl opacity-50" />
                  <h1 className="relative text-5xl md:text-7xl font-bold font-display tracking-tight text-pretty">
                    {t('home.heroTitle')}
                  </h1>
                </div>
                <h2 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight text-pretty bg-clip-text text-transparent bg-gradient-to-r from-foreground/90 to-foreground/60">
                  {t('home.subtitle')}
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground text-pretty">
                  {t('home.description')}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-16 md:mt-24 flex justify-center"
              >
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button size="lg" className="bg-heimdal-orange hover:bg-heimdal-navy text-white text-xl font-semibold px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      {t('home.startButton')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-gradient-to-b from-heimdal-orange/5 to-heimdal-navy/5">
                    <SheetHeader>
                      <SheetTitle className="text-2xl font-bold">{t('home.createMatch')}</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-2">
                        <Label>{t('home.teamSize')}: {teamSize}v{teamSize}</Label>
                        <Slider defaultValue={[7]} min={3} max={11} step={1} onValueChange={(val) => setTeamSize(val[0])} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">{t('home.duration')}</Label>
                        <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1" max="120" />
                      </div>
                      <div className="space-y-4">
                        <Label>{t('home.lineupSelect', { size: teamSize })}</Label>
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md">
                          {players.map(player => (
                            <div key={player.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`player-${player.id}`}
                                checked={selectedPlayerIds.includes(player.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedPlayerIds(prev =>
                                    checked ? [...prev, player.id] : prev.filter(id => id !== player.id)
                                  );
                                }}
                              />
                              <label htmlFor={`player-${player.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {player.name} (#{player.number})
                              </label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedPlayerIds.length} / {players.length} selected</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="carryover" checked={carryover} onCheckedChange={setCarryover} />
                        <Label htmlFor="carryover">{t('home.carryover')}</Label>
                      </div>
                      <Button onClick={handleStartMatch} size="lg" className="w-full bg-heimdal-orange hover:bg-heimdal-navy text-white text-lg font-semibold">
                        {t('home.startConfirm')}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
      <Toaster richColors />
    </>
  );
}