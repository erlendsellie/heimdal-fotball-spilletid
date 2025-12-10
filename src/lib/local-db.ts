import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Match, MatchEvent } from '@shared/types';
const DB_NAME = 'heimdal-spilletid-db';
const DB_VERSION = 1;
interface HeimdalDB extends DBSchema {
  matches: { key: string; value: Match; };
  players: { key: string; value: Player; indexes: { teamId: string }; };
  oplog: { key: string; value: MatchEvent; indexes: { matchId: string; synced: number }; };
  meta: { key: string; value: any; };
}
let dbPromise: Promise<IDBPDatabase<HeimdalDB>> | null = null;
const getDb = (): Promise<IDBPDatabase<HeimdalDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<HeimdalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('matches')) {
          db.createObjectStore('matches', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('players')) {
          const playersStore = db.createObjectStore('players', { keyPath: 'id' });
          playersStore.createIndex('teamId', 'teamId');
        }
        if (!db.objectStoreNames.contains('oplog')) {
          const oplogStore = db.createObjectStore('oplog', { keyPath: 'id' });
          oplogStore.createIndex('matchId', 'matchId');
          oplogStore.createIndex('synced', 'synced'); // 0 for false, 1 for true
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};
export const db = {
  async getMatch(matchId: string): Promise<Match | undefined> {
    return (await getDb()).get('matches', matchId);
  },
  async saveMatch(match: Match): Promise<void> {
    await (await getDb()).put('matches', match);
  },
  async getPlayers(teamId: string): Promise<Player[]> {
    return (await getDb()).getAllFromIndex('players', 'teamId', teamId);
  },
  async savePlayers(players: Player[]): Promise<void> {
    const tx = (await getDb()).transaction('players', 'readwrite');
    await Promise.all([...players.map(p => tx.store.put(p)), tx.done]);
  },
  async addEvent(eventPayload: Omit<MatchEvent, 'id' | 'ts' | 'synced'>): Promise<MatchEvent> {
    const db = await getDb();
    const event: MatchEvent = {
      ...eventPayload,
      id: uuidv4(),
      ts: Date.now(),
      synced: false,
    };
    await db.add('oplog', event);
    return event;
  },
  async getUnsyncedEvents(): Promise<MatchEvent[]> {
    return (await getDb()).getAllFromIndex('oplog', 'synced', 0);
  },
  async markEventsAsSynced(eventIds: string[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('oplog', 'readwrite');
    const eventsToUpdate = await Promise.all(eventIds.map(id => tx.store.get(id)));
    const updates = eventsToUpdate
      .filter((event): event is MatchEvent => !!event)
      .map(event => tx.store.put({ ...event, synced: true }));
    await Promise.all([...updates, tx.done]);
  },
  async compactOplog(): Promise<void> {
    const db = await getDb();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let cursor = await db.transaction('oplog').store.openCursor();
    while (cursor) {
      if (cursor.value.synced && cursor.value.ts < sevenDaysAgo) {
        if (typeof cursor.delete === 'function') {
          // await deletion to ensure proper ordering and satisfy TypeScript that delete is callable
          await (cursor.delete as () => Promise<void>)();
        }
      }
      // safely call continue if available, otherwise set to null to exit loop
      // some environments may not have continue as a callable function
      cursor = await (cursor.continue?.() ?? null);
    }
  },
};
export default db;