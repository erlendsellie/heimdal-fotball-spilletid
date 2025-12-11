import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Match, MatchEvent } from '@shared/types';
const DB_NAME = 'heimdal-spilletid-db';
const DB_VERSION = 2; // Incremented version for schema change
interface HeimdalDB extends DBSchema {
  matches: { key: string; value: Match; };
  players: { key: string; value: Player; indexes: { teamId: string }; };
  oplog: { key: string; value: MatchEvent; indexes: { matchId: string; synced: 'true' | 'false' }; };
  meta: { key: string; value: any; };
}
let dbPromise: Promise<IDBPDatabase<HeimdalDB>> | null = null;
const getDb = (): Promise<IDBPDatabase<HeimdalDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<HeimdalDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
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
            oplogStore.createIndex('synced', 'synced');
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
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
  async savePlayer(player: Player): Promise<void> {
    await (await getDb()).put('players', player);
  },
  async savePlayers(players: Player[]): Promise<void> {
    const tx = (await getDb()).transaction('players', 'readwrite');
    await Promise.all([...players.map(p => tx.store.put(p)), tx.done]);
  },
  async deletePlayer(playerId: string): Promise<void> {
    await (await getDb()).delete('players', playerId);
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
    return (await getDb()).getAllFromIndex('oplog', 'synced', 'false');
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
  async getMeta(key: string): Promise<any> {
    const result = await (await getDb()).get('meta', key);
    return result ? result.value : undefined;
  },
  async setMeta(key: string, value: any): Promise<void> {
    await (await getDb()).put('meta', { key, value });
  },
  async getPreviousMinutes(): Promise<Record<string, number>> {
    return (await this.getMeta('lastSessionMinutes')) || {};
  },
};
export default db;