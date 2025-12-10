import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { MOCK_MATCHES } from '@shared/mock-data';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
export function HomePage() {
  const { t } = useTranslation();
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
              <div className="mt-24 md:mt-32">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-bold">{t('home.upcomingMatches')}</h3>
                  <Button variant="ghost" asChild>
                    <Link to="/tournament">
                      {t('home.viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
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
                          <CardTitle className="text-xl">Heimdal {t('match.opponent')} {match.opponent}</CardTitle>
                          <CardDescription>{new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">
                            {match.duration_minutes} minutter �� {match.status}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button asChild className="w-full bg-heimdal-orange hover:bg-heimdal-navy text-white">
                            <Link to={`/match/${match.id}`} aria-label={`${t('home.openMatch')} for Heimdal vs ${match.opponent}`}>
                              {t('home.openMatch')} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Toaster richColors />
    </>
  );
}