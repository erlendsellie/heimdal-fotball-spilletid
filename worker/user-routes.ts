import { Hono } from "hono";
import { bearerAuth } from 'hono/bearer-auth';
import type { Env } from './core-utils';
import { UserEntity, MatchEntity, TournamentEntity, PlayerEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { MatchEvent, User } from "@shared/types";
const DUMMY_TOKEN = "secret-token-for-dev";
const authMiddleware = bearerAuth({ token: DUMMY_TOKEN });
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.post('/api/seed', async (c) => {
    try {
      const existingUser = await UserEntity.findByEmail(c.env, 'trener@heimdal.no');
      if (!existingUser) {
        const user: User = {
          id: crypto.randomUUID(),
          name: 'Trener Test',
          email: 'trener@heimdal.no',
          passwordHash: 'password123',
          role: 'trener',
        };
        await UserEntity.create(c.env, user);
      }
      await PlayerEntity.ensureSeed(c.env);
      await MatchEntity.ensureSeed(c.env);
      return ok(c, { seeded: true });
    } catch (e) {
      console.error('Seed error:', e);
      return c.json({ success: false, error: 'Server error during seeding' }, 500);
    }
  });
  app.post('/api/auth/login', async (c) => {
    try {
      const { email, password } = await c.req.json<{ email?: string, password?: string }>();
      if (!isStr(email) || !isStr(password)) return bad(c, 'Email and password required');
      const userEntity = await UserEntity.findByEmail(c.env, email);
      if (!userEntity) return notFound(c, 'User not found');
      const user = await userEntity.getState();
      if (user.passwordHash !== password) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
      const { passwordHash, ...userSafe } = user;
      return ok(c, { token: DUMMY_TOKEN, user: userSafe });
    } catch (e) {
      console.error('Login error:', e);
      return c.json({ success: false, error: 'Server error during login' }, 500);
    }
  });
  app.use('/api/*', authMiddleware);
  const observerGuard = async (c: any, next: any) => {
    const userRole: User['role'] = (c.req.header('X-User-Role') || 'trener') as User['role'];
    if (userRole === 'observatør' && c.req.method !== 'GET') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    await next();
  };
  app.get('/api/matches', async (c) => {
    try {
      const page = await MatchEntity.list(c.env);
      return ok(c, page.items);
    } catch (e) {
      console.error('Get matches error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/matches/:id/sync', observerGuard, async (c) => {
    const matchId = c.req.param('id');
    try {
      const { events } = await c.req.json<{ events: MatchEvent[] }>();
      if (!events || !Array.isArray(events) || events.length === 0) return ok(c, { syncedIds: [], conflicts: 0 });
      const match = new MatchEntity(c.env, matchId);
      if (!await match.exists()) return notFound(c, 'Match not found');
      const { acknowledgedIds, conflicts } = await match.applyEvents(events);
      return ok(c, { syncedIds: acknowledgedIds, conflicts });
    } catch (e) {
      console.error(`Sync error for match ${matchId}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/matches/:id/pull', async (c) => {
    const matchId = c.req.param('id');
    try {
      const { clientTs } = await c.req.json<{ clientTs: number }>();
      const match = new MatchEntity(c.env, matchId);
      if (!await match.exists()) return notFound(c, 'Match not found');
      const state = await match.getState();
      const deltaEvents = state.events.filter(e => e.ts > clientTs);
      return ok(c, { events: deltaEvents, serverTs: Date.now() });
    } catch (e) {
      console.error(`Pull error for match ${matchId}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.get('/api/players', async (c) => {
    try {
      const list = await PlayerEntity.list(c.env);
      return ok(c, list.items);
    } catch (e) {
      console.error('Get players error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/players', observerGuard, async (c) => {
    try {
      const player = await c.req.json();
      if (!isStr(player.name)) return bad(c, 'Player name required');
      const newPlayer = await PlayerEntity.create(c.env, { ...player, id: crypto.randomUUID() });
      return ok(c, newPlayer);
    } catch (e) {
      console.error('Create player error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.get('/api/tournaments', async (c) => {
    try {
      const page = await TournamentEntity.list(c.env);
      return ok(c, page.items);
    } catch (e) {
      console.error('Get tournaments error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/tournaments', observerGuard, async (c) => {
    try {
      const { name, carryover_rules } = await c.req.json();
      if (!isStr(name)) return bad(c, 'Tournament name required');
      const tournament = await TournamentEntity.create(c.env, {
        id: crypto.randomUUID(),
        name,
        matchIds: [],
        carryover_rules: carryover_rules || { enabled: false },
      });
      return ok(c, tournament);
    } catch (e) {
      console.error('Create tournament error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.get('/api/tournaments/:id/stats', async (c) => {
    const tournamentId = c.req.param('id');
    try {
      const tournament = new TournamentEntity(c.env, tournamentId);
      if (!await tournament.exists()) return notFound(c, 'Tournament not found');
      const stats = await tournament.aggregateStats(c.env);
      return ok(c, stats);
    } catch (e) {
      console.error(`Stats error for tournament ${tournamentId}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
}