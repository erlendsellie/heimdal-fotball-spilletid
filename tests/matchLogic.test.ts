import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestSwaps } from '../src/lib/substitutionSuggestions';
import { pollMatch } from '../src/lib/sync';
import type { Player } from '../shared/types';
import { formatTime } from '../src/lib/utils';
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
    const minutesPlayed = { p1: 45, p2: 30, p3: 40, p4: 0, p5: 15 };
    const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, MOCK_BENCH_PLAYERS, minutesPlayed, 'even');
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].out.id).toBe('p1');
    expect(suggestions[0].in.id).toBe('p4');
  });
  it('handles empty bench gracefully', () => {
    const minutesPlayed = { p1: 45, p2: 30, p3: 40 };
    const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, [], minutesPlayed, 'even');
    expect(suggestions).toEqual([]);
  });
});
describe('Carryover Logic', () => {
    it('prioritizes players with deficits in "even" strategy suggestions', () => {
        const minutesPlayed = { p1: -5, p2: 10, p3: 5, p4: 0, p5: 2 };
        const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, MOCK_BENCH_PLAYERS, minutesPlayed, 'even');
        // p2 has played the most (10), should be swapped out.
        // p4 has played the least on bench (0), should be swapped in.
        // The logic sorts field players by minutes DESC, so p2 comes first.
        expect(suggestions[0].out.id).toBe('p2');
        expect(suggestions[0].in.id).toBe('p4');
    });
});
describe('Sync Logic', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it('pollMatch returns lastTs on offline error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const lastTs = 12345;
    // The implementation in sync.ts now catches the error internally and returns lastTs
    const result = await pollMatch('m1', lastTs);
    expect(result).toBe(lastTs);
  });
});
describe('Match Clock Logic', () => {
  it('should format time correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59 * 1000)).toBe('00:59');
    expect(formatTime(60 * 1000)).toBe('01:00');
    expect(formatTime(45 * 60 * 1000)).toBe('45:00');
  });
});