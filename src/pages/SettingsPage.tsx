import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast, Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Navigation } from '@/components/Navigation';
import { Download, Palette, Settings as SettingsIcon } from 'lucide-react';
const mockStatsData = [
  { name: 'Ola N.', minutes: 120 },
  { name: 'Kari S.', minutes: 110 },
  { name: 'Aksel L.', minutes: 135 },
  { name: 'Ingrid J.', minutes: 180 },
  { name: 'Sven O.', minutes: 95 },
];
const COLORS = ['#0B3D91', '#E55A1B', '#8884d8', '#82ca9d', '#ffc658'];
export function SettingsPage() {
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground flex items-center gap-3">
              <SettingsIcon className="w-10 h-10 text-heimdal-orange" />
              Settings & Exports
            </h1>
            <p className="text-muted-foreground mt-2">Customize the app and export your data.</p>
          </div>
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="exports">Exports</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-policy">Automatic Sync</Label>
                    <Switch id="sync-policy" defaultChecked />
                  </div>
                  <Button onClick={() => toast.info("PWA install prompt would show here.")}>
                    Install App on Device
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="stats" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Player Statistics</CardTitle>
                  <CardDescription>Total minutes played this season.</CardDescription>
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
                        <Bar dataKey="minutes" fill="#0B3D91" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="exports" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download match or tournament data.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <Button variant="outline" onClick={() => toast.info("Exporting CSV...")}>
                    <Download className="mr-2 h-4 w-4" /> Export as CSV
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Exporting JSON...")}>
                    <Download className="mr-2 h-4 w-4" /> Export as JSON
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}