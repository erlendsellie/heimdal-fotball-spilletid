import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MOCK_PLAYERS } from '@shared/mock-data';
import type { Player } from '@shared/types';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
export function TeamPage() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [searchTerm, setSearchTerm] = useState('');
  const positionMap: Record<Player['position'], string> = useMemo(() => ({
    'Forward': t('positions.forward'),
    'Midfield': t('positions.midfield'),
    'Defense': t('positions.defense'),
    'Goalkeeper': t('positions.goalkeeper')
  }), [t]);
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center gap-3">
                  <User className="w-10 h-10 text-heimdal-orange" />
                  {t('team.title')}
                </h1>
                <p className="text-muted-foreground mt-2">{t('team.description')}</p>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="lg" className="bg-heimdal-orange hover:bg-heimdal-navy text-white shadow-lg">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      {t('team.addTitle')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{t('team.addTitle')}</SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      {/* Add Player Form */}
                      <Button onClick={() => toast.success(t('team.added'))}>Add Player</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <Input
              placeholder={t('team.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-8 max-w-sm"
              aria-label={t('team.searchPlaceholder')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlayers.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{player.name}</CardTitle>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-heimdal-navy text-white font-bold text-sm">
                        {player.number}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{positionMap[player.position]}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}