import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { MOCK_MATCHES } from '@shared/mock-data';
export function HomePage() {
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="min-h-screen bg-background text-foreground">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#E55A1B] to-[#0B3D91] rounded-full blur-xl opacity-50" />
                <h1 className="relative text-5xl md:text-7xl font-bold font-display tracking-tight text-pretty">
                  Heimdal Fotball
                </h1>
              </div>
              <h2 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight text-pretty bg-clip-text text-transparent bg-gradient-to-r from-foreground/90 to-foreground/60">
                Spilletid & Bytte-verktøy
              </h2>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground text-pretty">
                Kontroller og følg spilletid for hver spiller i sanntid. Fungerer offline, med smarte forslag til bytter.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Button size="lg" className="bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white shadow-lg transition-transform hover:scale-105">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Ny Kamp
                </Button>
                <Button size="lg" variant="outline" className="transition-transform hover:scale-105">
                  Se Turneringer
                </Button>
              </div>
            </motion.div>
            {/* Upcoming Matches Section */}
            <div className="mt-24 md:mt-32">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold">Kommende Kamper</h3>
                <Button variant="ghost">
                  Se alle <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_MATCHES.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                      <CardHeader>
                        <CardTitle className="text-xl">Heimdal vs. {match.opponent}</CardTitle>
                        <CardDescription>{new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          {match.duration_minutes} minutter • {match.status}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full bg-[#E55A1B] hover:bg-[#D14615] text-white">
                          <Link to={`/match/${match.id}`}>
                            Åpne Kamp <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <footer className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">
            Built with ��️ at Cloudflare
          </p>
        </footer>
      </div>
      <Toaster richColors />
    </>
  );
}