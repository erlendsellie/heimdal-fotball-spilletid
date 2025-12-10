import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast, Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { Download, Settings as SettingsIcon } from 'lucide-react';
const mockStatsData = [
  { name: 'Ola N.', minutter: 120 },
  { name: 'Kari S.', minutter: 110 },
  { name: 'Aksel L.', minutter: 135 },
  { name: 'Ingrid J.', minutter: 180 },
  { name: 'Sven O.', minutter: 95 },
];
export function SettingsPage() {
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center gap-3">
                <SettingsIcon className="w-10 h-10 text-heimdal-yellow" />
                Innstillinger & Eksport
              </h1>
              <p className="text-muted-foreground mt-2">Tilpass appen og eksporter dataene dine.</p>
            </div>
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">Innstillinger</TabsTrigger>
                <TabsTrigger value="stats">Statistikk</TabsTrigger>
                <TabsTrigger value="exports">Eksport</TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generelle Innstillinger</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-policy">Automatisk Synkronisering</Label>
                      <Switch id="sync-policy" defaultChecked />
                    </div>
                    <Button onClick={() => toast.info("Installasjonsdialog for PWA ville vist seg her.")}>
                      Installer App på Enhet
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spillerstatistikk</CardTitle>
                    <CardDescription>Totalt antall minutter spilt denne sesongen.</CardDescription>
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
                          <Bar dataKey="minutter" fill="#006400" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="exports" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Eksporter Data</CardTitle>
                    <CardDescription>Last ned kamp- eller turneringsdata.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Button variant="outline" className="border-heimdal-red text-heimdal-red hover:bg-heimdal-red hover:text-white" onClick={() => toast.info("Eksporterer CSV...")}>
                      <Download className="mr-2 h-4 w-4" /> Eksporter som CSV
                    </Button>
                    <Button variant="outline" className="border-heimdal-red text-heimdal-red hover:bg-heimdal-red hover:text-white" onClick={() => toast.info("Eksporterer JSON...")}>
                      <Download className="mr-2 h-4 w-4" /> Eksporter som JSON
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