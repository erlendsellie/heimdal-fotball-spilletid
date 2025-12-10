import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Tournament } from '@shared/types';
export function TournamentPage() {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchTournaments() {
      try {
        // Mocking API call for now
        const mockTournamentsData = [
          { id: 't1', name: 'Vinterserien 2024', matchIds: ['m1', 'm2'], carryover_rules: { enabled: false } },
          { id: 't2', name: 'Trønder-Cup', matchIds: ['m3'], carryover_rules: { enabled: false } },
        ];
        setTournaments(mockTournamentsData);
      } catch (error) {
        toast.error("Failed to load tournaments.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTournaments();
  }, []);
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
                  <Trophy className="w-10 h-10 text-heimdal-orange" />
                  {t('tournament.title')}
                </h1>
                <p className="text-muted-foreground mt-2">{t('tournament.description')}</p>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="lg" className="bg-heimdal-navy hover:bg-heimdal-orange text-white shadow-lg" aria-label={t('tournament.new')}>
                      <PlusCircle className="mr-2 h-5 w-5" />
                      {t('tournament.new')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{t('tournament.createTitle')}</SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">{t('tournament.name')}</Label>
                        <Input id="name" placeholder="f.eks., Vinterserien 2025" className="col-span-3" />
                      </div>
                      <div className="flex items-center space-x-2 justify-end py-4">
                        <Label htmlFor="carryover-mode">{t('tournament.carryover')}</Label>
                        <Switch id="carryover-mode" />
                      </div>
                      <Button onClick={() => toast.success(t('tournament.created'))}>{t('tournament.create')}</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tournaments.map((tournament, i) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                      <CardHeader>
                        <CardTitle className="text-xl">{tournament.name}</CardTitle>
                        <CardDescription>{tournament.matchIds.length} kamper</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        {/* Stats would be displayed here */}
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full border-heimdal-orange text-heimdal-orange hover:bg-heimdal-orange hover:text-white">
                          {t('tournament.viewDetails')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}