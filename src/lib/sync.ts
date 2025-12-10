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
    if (isManual) {
      toast.info(isSyncing ? 'Sync already in progress.' : 'You are offline.');
    }
    return { success: false, reason: isSyncing ? 'already_syncing' : 'offline' };
  }
  isSyncing = true;
  if (isManual) toast.loading('Syncing match data...');
  console.log('Starting sync...');
  try {
    const unsyncedEvents = await db.getUnsyncedEvents();
    if (unsyncedEvents.length === 0) {
      if (isManual) toast.success('Everything is up to date!');
      console.log('No events to sync.');
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
        console.log(`Synced ${response.syncedIds.length} events for match ${matchId}`);
      } catch (error) {
        console.error(`Failed to sync events for match ${matchId}:`, error);
        throw error; // Propagate to outer catch for retry logic
      }
    }
    if (isManual) toast.success(`Successfully synced ${totalSynced} updates.`);
    console.log('Sync finished.');
    retryCount = 0; // Reset on success
    return { success: true, synced: totalSynced };
  } catch (error) {
    console.error('Sync process failed:', error);
    if (isManual) toast.error('Sync failed. Will retry in the background.');
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      setTimeout(runSync, RETRY_DELAY_MS * Math.pow(2, retryCount)); // Exponential backoff
    } else {
      console.error('Max sync retries reached.');
    }
    return { success: false, reason: 'api_error' };
  } finally {
    isSyncing = false;
    if (isManual) toast.dismiss();
  }
}
// Periodic sync
setInterval(runSync, 60 * 1000); // every 60 seconds
// Sync on connectivity change
window.addEventListener('online', () => {
  retryCount = 0; // Reset retries when coming online
  runSync();
});