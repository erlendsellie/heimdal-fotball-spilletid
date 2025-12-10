import { api } from './api-client';
import db from './local-db';
import { auth } from './auth';
import type { MatchEvent } from '@shared/types';
import { toast } from 'sonner';
let isSyncing = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
export async function runSync(isManual = false) {
  if (isSyncing || !navigator.onLine) {
    if (isManual) toast.info(isSyncing ? 'Sync already in progress.' : 'You are offline.');
    return { success: false, reason: isSyncing ? 'already_syncing' : 'offline' };
  }
  isSyncing = true;
  if (isManual) toast.loading('Syncing match data...');
  try {
    const unsyncedEvents = await db.getUnsyncedEvents();
    if (unsyncedEvents.length === 0) {
      if (isManual) toast.success('Everything is up to date!');
      retryCount = 0;
      return { success: true, synced: 0 };
    }
    const eventsByMatch = unsyncedEvents.reduce((acc, event) => {
      if (!acc[event.matchId]) acc[event.matchId] = [];
      acc[event.matchId].push(event);
      return acc;
    }, {} as Record<string, MatchEvent[]>);
    let totalSynced = 0;
    for (const matchId in eventsByMatch) {
      try {
        const response = await api<{ syncedIds: string[], conflicts: number }>(`/api/matches/${matchId}/sync`, {
          method: 'POST',
          headers: auth.getAuthHeader(),
          body: JSON.stringify({ events: eventsByMatch[matchId] }),
        });
        if (response.syncedIds.length > 0) {
          await db.markEventsAsSynced(response.syncedIds);
          totalSynced += response.syncedIds.length;
        }
        if (response.conflicts > 0) {
          toast.warning(`${response.conflicts} conflicts detected. Last-write-wins was applied.`);
        }
      } catch (error) {
        console.error(`Failed to sync events for match ${matchId}:`, error);
        throw error;
      }
    }
    if (isManual) toast.success(`Successfully synced ${totalSynced} updates.`);
    retryCount = 0;
    return { success: true, synced: totalSynced };
  } catch (error) {
    console.error('Sync process failed:', error);
    if (isManual) toast.error('Sync failed. Will retry in the background.');
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      setTimeout(() => runSync(), RETRY_DELAY_MS * Math.pow(2, retryCount));
    } else {
      console.error('Max sync retries reached.');
    }
    return { success: false, reason: 'api_error' };
  } finally {
    isSyncing = false;
    if (isManual) toast.dismiss();
  }
}
export async function pollMatch(matchId: string, lastSyncTs: number) {
  if (!navigator.onLine) return;
  try {
    const { events, serverTs } = await api<{ events: MatchEvent[], serverTs: number }>(`/api/matches/${matchId}/pull`, {
      method: 'POST',
      headers: auth.getAuthHeader(),
      body: JSON.stringify({ clientTs: lastSyncTs }),
    });
    if (events.length > 0) {
      // In a real app, you would merge these events into the local state/oplog
      toast.info(`${events.length} new updates from other coaches.`);
    }
    return serverTs;
  } catch (error) {
    console.error('Polling failed:', error);
    return lastSyncTs;
  }
}
setInterval(runSync, 60 * 1000);
window.addEventListener('online', () => {
  retryCount = 0;
  runSync();
});