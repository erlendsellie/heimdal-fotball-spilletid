import { Hono } from "hono";
import { bearerAuth } from 'hono/bearer-auth';
import type { Env } from './core-utils';
import { UserEntity, MatchEntity, TournamentEntity, PlayerEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { MatchEvent } from "@shared/types";
// Dummy token for demo purposes. In production, use a secure, signed token (JWT).
const DUMMY_TOKEN = "secret-token-for-dev";
const authMiddleware = bearerAuth({ token: DUMMY_TOKEN });
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- SEEDING (for demo) ---
  app.post('/api/seed', async (c) => {
    // Seed a default user for login
    const existingUser = await UserEntity.findByEmail(c.env, 'trener@heimdal.no');
    if (!existingUser) {
      await UserEntity.create(c.env, {
        id: crypto.randomUUID(),
        email: 'trener@heimdal.no',
        // In a real app, NEVER store plain text passwords. Use a secure hashing algorithm like Argon2.
        passwordHash: 'password123', 
        role: 'trener',
      });
    }
    await PlayerEntity.ensureSeed(c.env);
    await MatchEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
  // --- AUTH ---
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email?: string, password?: string }>();
    if (!isStr(email) || !isStr(password)) return bad(c, 'Email and password required');
    const userEntity = await UserEntity.findByEmail(c.env, email);
    if (!userEntity) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    // WARNING: This is insecure plain text password comparison for demo only.
    if (user.passwordHash !== password) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    return ok(c, { token: DUMMY_TOKEN, user: { id: user.id, email: user.email, role: user.role } });
  });
  // --- MATCHES ---
  app.get('/api/matches', authMiddleware, async (c) => {
    const page = await MatchEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/matches/:id/sync', authMiddleware, async (c) => {
    const matchId = c.req.param('id');
    const { events } = await c.req.json<{ events: MatchEvent[] }>();
    if (!events || !Array.isArray(events)) return bad(c, 'Invalid events payload');
    const match = new MatchEntity(c.env, matchId);
    if (!await match.exists()) return notFound(c, 'Match not found');
    const { acknowledgedIds, conflicts } = await match.applyEvents(events);
    return ok(c, { syncedIds: acknowledgedIds, conflicts });
  });
  // --- TOURNAMENTS ---
  app.get('/api/tournaments', authMiddleware, async (c) => {
    const page = await TournamentEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/tournaments', authMiddleware, async (c) => {
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
  // --- EXPORT ---
  app.get('/api/export/:type', authMiddleware, async (c) => {
    const type = c.req.param('type');
    if (type !== 'json' && type !== 'csv') return bad(c, 'Invalid export type');
    // This is a placeholder for a real export implementation
    const players = await PlayerEntity.list(c.env);
    const data = players.items.map(p => ({
      id: p.id,
      name: p.name,
      minutes_played: Math.floor(Math.random() * 200),
    }));
    if (type === 'json') {
      return c.json(data);
    }
    // CSV export using a simple string builder. Papaparse would be better for complex data.
    if (type === 'csv') {
      const headers = 'id,name,minutes_played\n';
      const rows = data.map(d => `${d.id},${d.name},${d.minutes_played}`).join('\n');
      return c.text(headers + rows, 200, { 'Content-Type': 'text/csv' });
    }
    return bad(c, 'Should not be reached');
  });
}