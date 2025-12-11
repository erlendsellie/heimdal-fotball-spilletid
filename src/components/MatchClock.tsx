import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import db from '@/lib/local-db';
import { useTranslation } from '@/lib/translations';
type ClockStatus = 'stopped' | 'running' | 'paused';
interface MatchClockProps {
  matchId: string;
  initialTimeMs?: number;
  durationMinutes: number;
  onTick?: (elapsedMs: number) => void;
  onStatusChange?: (status: ClockStatus, elapsedMs: number) => void;
}
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
export function MatchClock({ matchId, initialTimeMs = 0, durationMinutes, onTick, onStatusChange }: MatchClockProps) {
  const { t } = useTranslation();
  const [elapsedMs, setElapsedMs] = useState(initialTimeMs);
  const [status, setStatus] = useState<ClockStatus>('stopped');
  const rafRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const durationMs = durationMinutes * 60 * 1000;
  const saveState = useCallback(async (currentStatus: ClockStatus, currentElapsedMs: number) => {
    await db.setMeta(`activeMatchClock_${matchId}`, {
      status: currentStatus,
      elapsedMs: currentElapsedMs,
      anchor: Date.now(),
    });
  }, [matchId]);
  useEffect(() => {
    const loadState = async () => {
      const savedState = await db.getMeta(`activeMatchClock_${matchId}`);
      if (savedState) {
        let newElapsedMs = savedState.elapsedMs;
        if (savedState.status === 'running') {
          const drift = Date.now() - savedState.anchor;
          newElapsedMs += drift;
        }
        setElapsedMs(Math.min(newElapsedMs, durationMs));
        setStatus(savedState.status);
        if (onStatusChange) onStatusChange(savedState.status, newElapsedMs);
      }
    };
    loadState();
  }, [matchId, durationMs, onStatusChange]);
  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTickTimeRef.current;
    lastTickTimeRef.current = now;
    setElapsedMs(prev => {
      const newTime = Math.min(prev + delta, durationMs);
      if (onTick) onTick(newTime);
      if (newTime >= durationMs) {
        setStatus('stopped');
        if (onStatusChange) onStatusChange('stopped', newTime);
        saveState('stopped', newTime);
        cancelAnimationFrame(rafRef.current);
      }
      return newTime;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, onTick, onStatusChange, saveState]);
  useEffect(() => {
    if (status === 'running') {
      lastTickTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, tick]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'running' || status === 'paused') {
        saveState(status, elapsedMs);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [status, elapsedMs, saveState]);
  const handleStatusChange = (newStatus: ClockStatus) => {
    let finalElapsed = elapsedMs;
    if (newStatus === 'stopped' && elapsedMs < durationMs) {
      finalElapsed = durationMs;
      setElapsedMs(finalElapsed);
    }
    if (newStatus === 'stopped' && elapsedMs >= durationMs) {
      finalElapsed = 0;
      setElapsedMs(finalElapsed);
    }
    setStatus(newStatus);
    saveState(newStatus, finalElapsed);
    if (onStatusChange) onStatusChange(newStatus, finalElapsed);
  };
  const progress = (elapsedMs / durationMs) * 100;
  return (
    <Card className="w-full max-w-md mx-auto text-center shadow-lg overflow-hidden">
      <CardContent className="p-6 relative">
        <div
          className="absolute top-0 left-0 h-full bg-heimdal-orange/20 transition-all duration-500 ease-linear"
          style={{ width: `${progress}%` }}
        />
        <div className="relative z-10">
          <div className="font-mono text-7xl md:text-8xl font-bold tracking-tighter text-foreground mb-4">
            {formatTime(elapsedMs)}
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            {formatTime(durationMs)}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            {status !== 'running' && (
              <Button size="lg" onClick={() => handleStatusChange('running')} className="w-28 bg-green-600 hover:bg-green-700 text-white">
                <Play className="mr-2 h-5 w-5" /> {status === 'paused' ? t('match.resume') : t('match.start')}
              </Button>
            )}
            {status === 'running' && (
              <Button size="lg" onClick={() => handleStatusChange('paused')} className="w-28 bg-yellow-500 hover:bg-yellow-600 text-white">
                <Pause className="mr-2 h-5 w-5" /> {t('match.pause')}
              </Button>
            )}
            <Button size="lg" variant="destructive" onClick={() => handleStatusChange('stopped')} className="w-28">
              <Square className="mr-2 h-5 w-5" /> {t('match.stop')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleStatusChange('stopped')}>
              <RotateCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}