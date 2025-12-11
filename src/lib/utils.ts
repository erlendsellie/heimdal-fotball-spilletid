import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
export const interpolateT = (str: string, vars: Record<string, any>): string => {
  if (!vars) return str;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), str);
};