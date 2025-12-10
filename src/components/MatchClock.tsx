import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
type ClockStatus = 'stopped' | 'running' | 'paused';
interface MatchClockProps {
  initialTimeMs?: number;
  durationMinutes: number;
  onTick?: (elapsedMs: number) => void;
  onStatusChange?: (status: ClockStatus) => void;
}
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
export function MatchClock({ initialTimeMs = 0, durationMinutes, onTick, onStatusChange }: MatchClockProps) {
  const [elapsedMs, setElapsedMs] = useState(initialTimeMs);
  const [status, setStatus] = useState<ClockStatus>('stopped');
  const rafRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const durationMs = durationMinutes * 60 * 1000;
  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTickTimeRef.current;
    lastTickTimeRef.current = now;
    setElapsedMs(prev => {
      const newTime = Math.min(prev + delta, durationMs);
      if (onTick) onTick(newTime);
      if (newTime >= durationMs) {
        setStatus('stopped');
        if (onStatusChange) onStatusChange('stopped');
        cancelAnimationFrame(rafRef.current);
      }
      return newTime;
    });
    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, onTick, onStatusChange]);
  useEffect(() => {
    if (status === 'running') {
      lastTickTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, tick]);
  const handleStart = () => {
    const newStatus = 'running';
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };
  const handlePause = () => {
    const newStatus = 'paused';
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };
  const handleStop = () => {
    const newStatus = 'stopped';
    setStatus(newStatus);
    setElapsedMs(durationMs);
    if (onStatusChange) onStatusChange(newStatus);
  };
  const handleReset = () => {
    const newStatus = 'stopped';
    setStatus(newStatus);
    setElapsedMs(0);
    if (onStatusChange) onStatusChange(newStatus);
  };
  const progress = (elapsedMs / durationMs) * 100;
  return (
    <Card className="w-full max-w-md mx-auto text-center shadow-lg overflow-hidden">
      <CardContent className="p-6 relative">
        <div
          className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-500 ease-linear"
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
            {status === 'stopped' && (
              <Button size="lg" onClick={handleStart} className="w-28 bg-green-600 hover:bg-green-700 text-white">
                <Play className="mr-2 h-5 w-5" /> Start
              </Button>
            )}
            {status === 'running' && (
              <Button size="lg" onClick={handlePause} className="w-28 bg-yellow-500 hover:bg-yellow-600 text-white">
                <Pause className="mr-2 h-5 w-5" /> Pause
              </Button>
            )}
            {status === 'paused' && (
              <Button size="lg" onClick={handleStart} className="w-28 bg-green-600 hover:bg-green-700 text-white">
                <Play className="mr-2 h-5 w-5" /> Resume
              </Button>
            )}
            <Button size="lg" variant="destructive" onClick={handleStop} className="w-28">
              <Square className="mr-2 h-5 w-5" /> Stop
            </Button>
            <Button size="lg" variant="outline" onClick={handleReset}>
              <RotateCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}