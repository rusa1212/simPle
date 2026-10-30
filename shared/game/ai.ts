import type { GameState } from './types.ts';
import { getPathLengths } from './game.ts';

/** 승패가 갈린 상태의 점수. 경로 길이 차이로는 나올 수 없는 큰 값이다. */
export const WIN_SCORE = 10000;

/** player 입장에서 본 점수: 상대 최단 경로 길이 − 내 최단 경로 길이. 클수록 유리하다. */
export function evaluate(state: GameState, player: number): number {
  if (state.winner !== null) return state.winner === player ? WIN_SCORE : -WIN_SCORE;
  const lengths = getPathLengths(state);
  const mine = lengths[player]!;
  const opponent = lengths[(player + 1) % state.players.length]!;
  return opponent - mine;
}
