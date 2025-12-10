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
const mockTournaments = [
  { id: 't1', name: 'Vinterserien 2024', matchCount: 8, status: 'Pågående' },
  { id: 't2', name: 'Trønder-Cup', matchCount: 5, status: 'Kommende' },
  { id: 't3', name: 'Sommerturnering', matchCount: 12, status: 'Fullført' },
];
export function TournamentPage() {
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
                  <Trophy className="w-10 h-10 text-heimdal-yellow" />
                  Turneringer
                </h1>
                <p className="text-muted-foreground mt-2">Administrer lagets turneringer og se samlet statistikk.</p>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button size="lg" className="bg-heimdal-green hover:bg-heimdal-green/90 text-white shadow-lg">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Ny Turnering
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Opprett Ny Turnering</SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Navn</Label>
                        <Input id="name" placeholder="f.eks., Vinterserien 2025" className="col-span-3" />
                      </div>
                      <div className="flex items-center space-x-2 justify-end py-4">
                        <Label htmlFor="carryover-mode">Aktiver Kompensasjonsregler</Label>
                        <Switch id="carryover-mode" />
                      </div>
                      <Button onClick={() => toast.success('Turnering opprettet! (Ikke implementert)')}>Opprett</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockTournaments.map((tournament, i) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                    <CardHeader>
                      <CardTitle className="text-xl">{tournament.name}</CardTitle>
                      <CardDescription>{tournament.status}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">
                        {tournament.matchCount} kamper
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full border-heimdal-red text-heimdal-red hover:bg-heimdal-red hover:text-white">
                        Vis Detaljer <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
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