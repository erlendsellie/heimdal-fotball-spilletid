import { IndexedEntity, Env } from "./core-utils";
import type { User, Player, Match, MatchEvent, Tournament, SubstitutionPayload } from "@shared/types";
import { MOCK_USERS, MOCK_PLAYERS, MOCK_MATCHES } from "@shared/mock-data";
// USER ENTITY for authentication
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "", passwordHash: "", role: "observatør" };
  static seedData = MOCK_USERS;
  static override keyOf<T>(state: T): string {
    const s = state as unknown as User;
    return s.email ?? s.id;
  }
  static async findByEmail(env: Env, email: string): Promise<UserEntity | null> {
    const user = new UserEntity(env, email);
    if (await user.exists()) {
      return user;
    }
    return null;
  }
}
// PLAYER ENTITY
export class PlayerEntity extends IndexedEntity<Player> {
  static readonly entityName = "player";
  static readonly indexName = "players";
  static readonly initialState: Player = { id: "", teamId: "", name: "", number: 0, position: "Midfield" };
  static seedData = MOCK_PLAYERS;
}
// MATCH ENTITY
export class MatchEntity extends IndexedEntity<Match> {
  static readonly entityName = "match";
  static readonly indexName = "matches";
  static readonly initialState: Match = { id: "", teamId: "", opponent: "", duration_minutes: 0, status: 'Klar', events: [] };
  static seedData = MOCK_MATCHES;
  async applyEvents(events: MatchEvent[]): Promise<{ acknowledgedIds: string[], conflicts: number }> {
    const acknowledgedIds: string[] = [];
    let conflicts = 0;
    try {
      await this.mutate(s => {
        const existingEventIds = new Set(s.events.map(e => e.id));
        const newEvents: MatchEvent[] = [];
        for (const event of events) {
          if (!existingEventIds.has(event.id)) {
            newEvents.push(event);
            acknowledgedIds.push(event.id);
          } else {
            conflicts++;
          }
        }
        if (newEvents.length > 0) {
          const allEvents = [...s.events, ...newEvents].sort((a, b) => a.ts - b.ts);
          return { ...s, events: allEvents };
        }
        return s;
      });
    } catch (e) {
      console.error('Event apply failed:', e);
      throw new Error('Concurrent update failed');
    }
    return { acknowledgedIds, conflicts };
  }
}
// TOURNAMENT ENTITY
export class TournamentEntity extends IndexedEntity<Tournament> {
  static readonly entityName = "tournament";
  static readonly indexName = "tournaments";
  static readonly initialState: Tournament = { id: "", name: "", matchIds: [], carryover_rules: { enabled: false } };
  async aggregateStats(env: Env): Promise<Record<string, { totalMinutes: number }>> {
    const state = await this.getState();
    const stats: Record<string, { totalMinutes: number }> = {};
    for (const matchId of state.matchIds) {
      const matchEntity = new MatchEntity(env, matchId);
      if (!(await matchEntity.exists())) continue;
      const match = await matchEntity.getState();
      const onField = new Set<string>();
      let lastTimestamp = 0;
      for (const event of match.events) {
        const elapsedSinceLastEvent = event.ts - lastTimestamp;
        onField.forEach(playerId => {
          if (!stats[playerId]) stats[playerId] = { totalMinutes: 0 };
          stats[playerId].totalMinutes += elapsedSinceLastEvent / (1000 * 60);
        });
        switch (event.type) {
          case 'START':
            // Assuming payload contains initial lineup
            if (event.payload?.initialLineup) {
              (event.payload.initialLineup as string[]).forEach(pId => onField.add(pId));
            }
            break;
          case 'SUBSTITUTION': {
            const payload = event.payload as SubstitutionPayload;
            if (payload) {
              onField.delete(payload.playerOutId);
              onField.add(payload.playerInId);
            }
            break;
          }
          case 'PAUSE':
          case 'STOP':
            onField.clear();
            break;
          case 'RESUME':
            // Need to know who was on field before pause
            break;
        }
        lastTimestamp = event.ts;
      }
    }
    // Round minutes for cleaner output
    for (const playerId in stats) {
        stats[playerId].totalMinutes = Math.round(stats[playerId].totalMinutes);
    }
    return stats;
  }
}