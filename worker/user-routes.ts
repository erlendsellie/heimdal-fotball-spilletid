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
  });
  app.post('/api/auth/login', async (c) => {
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
  });
  app.use('/api/*', authMiddleware);
  const observerGuard = async (c: any, next: any) => {
    // This is a placeholder for real role checking from a decoded JWT
    const userRole = 'trener'; // Assume trener for now
    if (userRole === 'observatør' && c.req.method !== 'GET') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    await next();
  };
  app.get('/api/matches', async (c) => {
    const page = await MatchEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/matches/:id/sync', observerGuard, async (c) => {
    const matchId = c.req.param('id');
    const { events } = await c.req.json<{ events: MatchEvent[] }>();
    if (!events || !Array.isArray(events)) return bad(c, 'Invalid events payload');
    const match = new MatchEntity(c.env, matchId);
    if (!await match.exists()) return notFound(c, 'Match not found');
    const { acknowledgedIds, conflicts } = await match.applyEvents(events);
    return ok(c, { syncedIds: acknowledgedIds, conflicts });
  });
  app.post('/api/matches/:id/pull', async (c) => {
    const matchId = c.req.param('id');
    const { clientTs } = await c.req.json<{ clientTs: number }>();
    const match = new MatchEntity(c.env, matchId);
    if (!await match.exists()) return notFound(c, 'Match not found');
    const state = await match.getState();
    const deltaEvents = state.events.filter(e => e.ts > clientTs);
    return ok(c, { events: deltaEvents, serverTs: Date.now() });
  });
  app.get('/api/players', async (c) => {
    const list = await PlayerEntity.list(c.env);
    return ok(c, list.items);
  });
  app.post('/api/players', observerGuard, async (c) => {
    const player = await c.req.json();
    if (!isStr(player.name)) return bad(c, 'Player name required');
    const newPlayer = await PlayerEntity.create(c.env, { ...player, id: crypto.randomUUID() });
    return ok(c, newPlayer);
  });
  app.get('/api/tournaments', async (c) => {
    const page = await TournamentEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/tournaments', observerGuard, async (c) => {
    const { name, carryover_rules } = await c.req.json();
    if (!isStr(name)) return bad(c, 'Tournament name required');
    const tournament = await TournamentEntity.create(c.env, {
      id: crypto.randomUUID(),
      name,
      matchIds: [],
      carryover_rules: carryover_rules || { enabled: false },
    });
    return ok(c, tournament);
  });
}