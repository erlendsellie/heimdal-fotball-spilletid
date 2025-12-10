import { IndexedEntity, Env } from "./core-utils";
import type { User, Player, Match, MatchEvent, Tournament } from "@shared/types";
import { MOCK_PLAYERS, MOCK_MATCHES } from "@shared/mock-data";
// USER ENTITY for authentication
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "", passwordHash: "", role: "observer" };
  static override keyOf(state: User): string { return state.email; }
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
    // This is a placeholder for a real stats calculation engine.
    // A real implementation would process the event log of each match to calculate minutes played.
    for (const matchId of state.matchIds) {
      const matchEntity = new MatchEntity(env, matchId);
      if (await matchEntity.exists()) {
        const match = await matchEntity.getState();
        // TODO: Implement event processing logic here
      }
    }
    // Placeholder logic for demo
    const players = await PlayerEntity.list(env);
    players.items.forEach(p => {
      stats[p.id] = { totalMinutes: Math.floor(Math.random() * 100 * state.matchIds.length) };
    });
    return stats;
  }
}