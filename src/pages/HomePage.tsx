import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [teamSize, setTeamSize] = useState(7);
  const [duration, setDuration] = useState(45);
  const [carryover, setCarryover] = useState(false);
  const handleStartMatch = async () => {
    if (duration < 1 || duration > 120) {
      toast.error('Duration must be between 1 and 120 minutes.');
      return;
    }
    const matchId = uuidv4();
    const matchConfig = {
      id: matchId,
      teamSize,
      duration,
      carryover,
      opponent: 'Motstander', // Placeholder
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
                className="mt-16 md:mt-24"
              >
                <Card className="max-w-2xl mx-auto bg-gradient-to-r from-heimdal-orange/5 to-heimdal-navy/5 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">{t('home.createMatch')}</CardTitle>
                    <CardDescription>{t('match.carryoverInfo')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="team-size">{t('home.teamSize')}</Label>
                        <Select value={String(teamSize)} onValueChange={(val) => setTeamSize(Number(val))}>
                          <SelectTrigger id="team-size">
                            <SelectValue placeholder="Select team size" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 9 }, (_, i) => i + 3).map(size => (
                              <SelectItem key={size} value={String(size)}>{size}v{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">{t('home.duration')}</Label>
                        <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min="1" max="120" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="carryover" checked={carryover} onCheckedChange={setCarryover} />
                      <Label htmlFor="carryover">{t('home.carryover')}</Label>
                    </div>
                    <Button onClick={handleStartMatch} size="lg" className="w-full bg-heimdal-orange hover:bg-heimdal-navy text-white text-lg font-semibold">
                      {t('home.startMatch')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
      <Toaster richColors />
    </>
  );
}