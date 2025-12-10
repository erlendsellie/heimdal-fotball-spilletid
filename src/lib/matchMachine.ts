import { createMachine, assign } from 'xstate';
import type { Player, MatchEvent } from '@shared/types';
export interface MatchContext {
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
  | { type: 'RESET'; context?: Partial<MatchContext> };
export const matchMachine = createMachine({
  id: 'match',
  types: {} as { context: MatchContext; events: MatchMachineEvent },
  initial: 'idle',
  context: {
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
        START: 'running',
      },
    },
    running: {
      on: {
        PAUSE: 'paused',
        STOP: 'stopped',
        TICK: {
          actions: assign({
            elapsedMs: ({ context, event }) => Math.min(context.elapsedMs + event.delta, context.durationMs),
          }),
        },
        SUBSTITUTE: {
          actions: assign({
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
        },
      },
    },
    paused: {
      on: {
        RESUME: 'running',
        STOP: 'stopped',
      },
    },
    stopped: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign( ({ event }) => ({
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
      actions: assign( ({ event }) => ({
        elapsedMs: 0,
        events: [],
        ...event.context,
      })),
    }
  }
});