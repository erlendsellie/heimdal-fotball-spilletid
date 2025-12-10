import { api } from './api-client';
import db from './local-db';
import type { MatchEvent } from '@shared/types';
let isSyncing = false;
export async function runSync() {
  if (isSyncing || !navigator.onLine) {
    return { success: false, reason: isSyncing ? 'already_syncing' : 'offline' };
  }
  isSyncing = true;
  console.log('Starting sync...');
  try {
    const unsyncedEvents = await db.getUnsyncedEvents();
    if (unsyncedEvents.length === 0) {
      console.log('No events to sync.');
      return { success: true, synced: 0 };
    }
    const eventsByMatch = unsyncedEvents.reduce((acc, event) => {
      if (!acc[event.matchId]) {
        acc[event.matchId] = [];
      }
      acc[event.matchId].push(event);
      return acc;
    }, {} as Record<string, MatchEvent[]>);
    let totalSynced = 0;
    for (const matchId in eventsByMatch) {
      try {
        // This is a mock sync. In a real app, the server would return which events were accepted.
        // For the demo, we assume all are accepted.
        await api(`/api/matches/${matchId}/sync`, {
          method: 'POST',
          body: JSON.stringify({ events: eventsByMatch[matchId] }),
        });
        const syncedIds = eventsByMatch[matchId].map(e => e.id);
        await db.markEventsAsSynced(syncedIds);
        totalSynced += syncedIds.length;
        console.log(`Synced ${syncedIds.length} events for match ${matchId}`);
      } catch (error) {
        console.error(`Failed to sync events for match ${matchId}:`, error);
        // Continue to next match
      }
    }
    console.log('Sync finished.');
    return { success: true, synced: totalSynced };
  } catch (error) {
    console.error('Sync process failed:', error);
    return { success: false, reason: 'unknown_error' };
  } finally {
    isSyncing = false;
  }
}
// Simple periodic sync
setInterval(runSync, 30 * 1000); // every 30 seconds
// Sync on connectivity change
window.addEventListener('online', runSync);