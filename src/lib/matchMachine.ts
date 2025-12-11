import { createMachine, assign } from 'xstate';
import type { Player, MatchEvent } from '@shared/types';
import db from './local-db';
export interface MatchContext {
  matchId: string;
  elapsedMs: number;
  durationMs: number;
  onField: Set<string>;
  onBench: Set<string>;
  events: MatchEvent[];
  players: Player[];
}
export type MatchMachineEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'TICK'; delta: number }
  | { type: 'SUBSTITUTE'; playerOutId: string; playerInId: string }
  | { type: 'RESET'; context?: Partial<MatchContext> }
  | { type: 'RESUME_LINEUP'; context: { onField: Set<string>; onBench: Set<string>; status?: string } };
const saveLineup = assign((context: MatchContext, event, { state }) => {
  if (context.matchId) {
    db.setMeta(`activeMatchLineup_${context.matchId}`, {
      onField: Array.from(context.onField),
      onBench: Array.from(context.onBench),
      status: state.value, // Save the current state value
    });
  }
  return context;
});
export const matchMachine = createMachine({
  id: 'match',
  types: {} as { context: MatchContext; events: MatchMachineEvent },
  initial: 'idle',
  context: {
    matchId: '',
    elapsedMs: 0,
    durationMs: 45 * 60 * 1000,
    onField: new Set<string>(),
    onBench: new Set<string>(),
    events: [],
    players: [],
  },
  states: {
    idle: {
      on: {
        START: {
          target: 'running',
          actions: [saveLineup],
        },
      },
    },
    running: {
      on: {
        PAUSE: {
          target: 'paused',
          actions: [saveLineup],
        },
        STOP: {
          target: 'stopped',
          actions: [saveLineup],
        },
        TICK: {
          actions: assign({
            elapsedMs: ({ context, event }) => Math.min(context.elapsedMs + event.delta, context.durationMs),
          }),
        },
        SUBSTITUTE: {
          actions: [
            assign({
              onField: ({ context, event }) => {
                const newOnField = new Set<string>(context.onField);
                newOnField.delete(event.playerOutId);
                newOnField.add(event.playerInId);
                return newOnField;
              },
              onBench: ({ context, event }) => {
                const newOnBench = new Set<string>(context.onBench);
                newOnBench.delete(event.playerInId);
                newOnBench.add(event.playerOutId);
                return newOnBench;
              },
            }),
            saveLineup,
          ],
        },
      },
    },
    paused: {
      on: {
        RESUME: {
          target: 'running',
          actions: [saveLineup],
        },
        STOP: {
          target: 'stopped',
          actions: [saveLineup],
        },
      },
    },
    stopped: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign(({ event }) => ({
            elapsedMs: 0,
            events: [],
            ...event.context,
          })),
        },
      },
    },
  },
  on: {
    RESET: {
      target: '.idle',
      actions: assign(({ event }) => ({
        elapsedMs: 0,
        events: [],
        ...event.context,
      })),
    },
    RESUME_LINEUP: {
      actions: assign({
        onField: ({ event }) => event.context.onField,
        onBench: ({ event }) => event.context.onBench,
      }),
    },
  },
});
export async function loadInitialContext(matchId?: string) {
  if (!matchId) return { onField: new Set<string>(), onBench: new Set<string>() };
  const lineup = await db.getMeta(`activeMatchLineup_${matchId}`);
  return lineup
    ? {
        onField: new Set(lineup.onField as string[]),
        onBench: new Set(lineup.onBench as string[]),
        status: lineup.status,
      }
    : { onField: new Set<string>(), onBench: new Set<string>() };
}