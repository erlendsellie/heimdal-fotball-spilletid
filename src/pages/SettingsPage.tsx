import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast, Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { Download, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
const mockStatsData = [
  { name: 'Ola N.', minutter: 120 },
  { name: 'Kari S.', minutter: 110 },
  { name: 'Aksel L.', minutter: 135 },
  { name: 'Ingrid J.', minutter: 180 },
  { name: 'Sven O.', minutter: 95 },
];
export function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const handleExport = async (format: 'csv' | 'json') => {
    toast.loading(t('settings.exporting'));
    try {
      const players = await db.getPlayers('heimdal-g12'); // Assuming a default teamId
      const matches = await db.getMatch('m1'); // Example, should fetch all
      const dataToExport = { players, matches: [matches] };
      if (format === 'csv') {
        const csv = Papa.unparse(players);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'spillere.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'data.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success(t('settings.exported'));
    } catch (error) {
      toast.error('Export failed.');
      console.error(error);
    }
  };
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center gap-3">
                <SettingsIcon className="w-10 h-10 text-heimdal-orange" />
                {t('settings.title')}
              </h1>
              <p className="text-muted-foreground mt-2">{t('settings.description')}</p>
            </div>
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings" aria-controls="settings-tab">{t('settings.general')}</TabsTrigger>
                <TabsTrigger value="stats" aria-controls="stats-tab">{t('settings.stats')}</TabsTrigger>
                <TabsTrigger value="exports" aria-controls="exports-tab">{t('settings.exports')}</TabsTrigger>
              </TabsList>
              <TabsContent value="settings" id="settings-tab" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.general')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-policy">{t('settings.autoSync')}</Label>
                      <Switch id="sync-policy" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language-toggle">Språk (Language)</Label>
                      <div className="flex items-center gap-2">
                        <span>NO</span>
                        <Switch id="language-toggle" checked={language === 'en'} onCheckedChange={(checked) => setLanguage(checked ? 'en' : 'nb')} />
                        <span>EN</span>
                      </div>
                    </div>
                    <Button onClick={() => toast.info(t('settings.installInfo'))}>
                      {t('settings.install')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats" id="stats-tab" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.playerStats')}</CardTitle>
                    <CardDescription>{t('settings.playerStatsDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 400 }}>
                      <ResponsiveContainer>
                        <BarChart data={mockStatsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="minutter" fill="#E55A1B" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="exports" id="exports-tab" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.exportData')}</CardTitle>
                    <CardDescription>{t('settings.exportDataDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Button variant="outline" className="border-heimdal-orange text-heimdal-orange hover:bg-heimdal-orange hover:text-white" onClick={() => handleExport('csv')}>
                      <Download className="mr-2 h-4 w-4" /> {t('settings.exportCSV')}
                    </Button>
                    <Button variant="outline" className="border-heimdal-orange text-heimdal-orange hover:bg-heimdal-orange hover:text-white" onClick={() => handleExport('json')}>
                      <Download className="mr-2 h-4 w-4" /> {t('settings.exportJSON')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}