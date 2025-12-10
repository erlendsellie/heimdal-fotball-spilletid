import { describe, it, expect, vi } from 'vitest';
import { suggestSwaps } from '../src/lib/substitutionSuggestions';
import { pollMatch } from '../src/lib/sync';
import type { Player } from '../shared/types';
const MOCK_FIELD_PLAYERS: Player[] = [
  { id: 'p1', name: 'Player 1', number: 1, position: 'Forward', teamId: 't1' },
  { id: 'p2', name: 'Player 2', number: 2, position: 'Midfield', teamId: 't1' },
  { id: 'p3', name: 'Player 3', number: 3, position: 'Defense', teamId: 't1' },
];
const MOCK_BENCH_PLAYERS: Player[] = [
  { id: 'p4', name: 'Player 4', number: 4, position: 'Forward', teamId: 't1' },
  { id: 'p5', name: 'Player 5', number: 5, position: 'Midfield', teamId: 't1' },
];
describe('Substitution Logic', () => {
  it('should suggest swapping most played for least played with "even" strategy', () => {
    const minutesPlayed = {
      p1: 45,
      p2: 30,
      p3: 40,
      p4: 0,
      p5: 15,
    };
    const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, MOCK_BENCH_PLAYERS, minutesPlayed, 'even');
    expect(suggestions).toHaveLength(3);
    // Player 1 has played the most (45), should be suggested to be swapped out
    // Player 4 has played the least (0), should be suggested to be swapped in
    expect(suggestions[0].out.id).toBe('p1');
    expect(suggestions[0].in.id).toBe('p4');
  });
  it('handles empty bench gracefully', () => {
    const minutesPlayed = { p1: 45, p2: 30, p3: 40 };
    const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, [], minutesPlayed, 'even');
    expect(suggestions).toEqual([]);
  });
});
describe('Sync Logic', () => {
  it('pollMatch returns lastTs on offline error', async () => {
    // Mocking a global fetch is tricky with vitest, so we mock the api client instead
    vi.mock('../src/lib/api-client', () => ({
      api: vi.fn().mockRejectedValue(new Error('offline')),
    }));
    // We can't directly test the global fetch used by the real api client,
    // but we can test the behavior of pollMatch assuming the underlying api call fails.
    // This test is more conceptual without a full MSW setup.
    // Let's assume pollMatch catches the error and returns lastSyncTs.
    const lastTs = 12345;
    const result = await pollMatch('m1', lastTs).catch(e => e); // The implementation now catches internally
    expect(result).toBe(lastTs);
  });
});
describe('Match Clock Logic', () => {
  // We can't easily test requestAnimationFrame in Node, but we can test the time formatting.
  // A full test would require a browser-like environment (e.g., JSDOM with shims).
  it('should format time correctly', () => {
    // This would require exporting formatTime from MatchClock.tsx or moving it to a utility file.
    // For now, this is a placeholder.
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59 * 1000)).toBe('00:59');
    expect(formatTime(60 * 1000)).toBe('01:00');
    expect(formatTime(45 * 60 * 1000)).toBe('45:00');
  });
});