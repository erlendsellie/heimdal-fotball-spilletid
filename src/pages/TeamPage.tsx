import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, User, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Player } from '@shared/types';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
import { api } from '@/lib/api-client';
const playerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  number: z.coerce.number().min(1, "Number must be at least 1").max(99, "Number must be 99 or less"),
  position: z.enum(['Goalkeeper', 'Defense', 'Midfield', 'Forward']),
  age: z.coerce.number().optional(),
  teamId: z.string().default('heimdal-g12'),
});
type PlayerFormData = z.infer<typeof playerSchema>;
export function TeamPage() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: { name: '', number: 0, position: 'Midfield', age: 0, teamId: 'heimdal-g12' },
  });
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const localPlayers = await db.getPlayers('heimdal-g12');
        setPlayers(localPlayers);
      } catch (error) {
        toast.error("Failed to load players.");
      }
    };
    fetchPlayers();
  }, []);
  useEffect(() => {
    if (isSheetOpen) {
      if (editingPlayer) {
        form.reset(editingPlayer);
      } else {
        form.reset({ name: '', number: 0, position: 'Midfield', age: 0, teamId: 'heimdal-g12' });
      }
    }
  }, [editingPlayer, isSheetOpen, form]);
  const onSubmit = async (data: PlayerFormData) => {
    const isUnique = !players.some(p => p.id !== editingPlayer?.id && p.number === data.number && p.teamId === data.teamId);
    if (!isUnique) {
      toast.error(t('team.uniqueNumber'));
      return;
    }
    try {
      if (editingPlayer) {
        const updatedPlayer = await api<Player>(`/api/players/${editingPlayer.id}`, { method: 'PUT', body: JSON.stringify(data) });
        const updatedPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
        setPlayers(updatedPlayers);
        await db.savePlayer(updatedPlayer);
        toast.success(t('team.updated'));
      } else {
        const newPlayer = await api<Player>('/api/players', { method: 'POST', body: JSON.stringify(data) });
        const newPlayers = [...players, newPlayer];
        setPlayers(newPlayers);
        await db.savePlayer(newPlayer);
        toast.success(t('team.added'));
      }
      setIsSheetOpen(false);
      setEditingPlayer(null);
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    }
  };
  const handleDelete = async (playerId: string) => {
    try {
      await api(`/api/players/${playerId}`, { method: 'DELETE' });
      const filteredPlayers = players.filter(p => p.id !== playerId);
      setPlayers(filteredPlayers);
      await db.deletePlayer(playerId);
      toast.success(t('team.deleted'));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete player.");
    }
  };
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
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="bg-heimdal-orange hover:bg-heimdal-navy text-white shadow-lg mt-4 sm:mt-0" onClick={() => { setEditingPlayer(null); setIsSheetOpen(true); }}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t('team.addTitle')}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{editingPlayer ? t('team.editTitle') : t('team.addTitle')}</SheetTitle>
                  </SheetHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t('team.name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="number" render={({ field }) => (
                        <FormItem><FormLabel>{t('team.number')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="position" render={({ field }) => (
                        <FormItem><FormLabel>{t('team.position')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Goalkeeper">{t('positions.goalkeeper')}</SelectItem>
                              <SelectItem value="Defense">{t('positions.defense')}</SelectItem>
                              <SelectItem value="Midfield">{t('positions.midfield')}</SelectItem>
                              <SelectItem value="Forward">{t('positions.forward')}</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="age" render={({ field }) => (
                        <FormItem><FormLabel>{t('team.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit">{t('team.save')}</Button>
                    </form>
                  </Form>
                </SheetContent>
              </Sheet>
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
                <motion.div key={player.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05 }}>
                  <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{player.name}</CardTitle>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-heimdal-navy text-white font-bold text-sm">
                        {player.number}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground">{t(`positions.${player.position.toLowerCase()}`)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${player.name}`} onClick={() => { setEditingPlayer(player); setIsSheetOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Delete ${player.name}`} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('team.deleteConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('team.deleteConfirmDesc')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('team.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(player.id)} className="bg-destructive hover:bg-destructive/90">{t('team.delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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