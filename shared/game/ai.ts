import type { Action, GameState, Orientation, WallKind } from './types.ts';
import { applyAction, getPathLengths, validateAction } from './game.ts';
import { getPawnMoves } from './moves.ts';

/** 승패가 갈린 상태의 점수. 경로 길이 차이로는 나올 수 없는 큰 값이다. */
export const WIN_SCORE = 10000;

const WALL_KINDS: readonly WallKind[] = ['normal', 'long', 'temp'];
const ORIENTATIONS: readonly Orientation[] = ['h', 'v'];

/** player 입장에서 본 점수: 상대 최단 경로 길이 − 내 최단 경로 길이. 클수록 유리하다. */
export function evaluate(state: GameState, player: number): number {
  if (state.winner !== null) return state.winner === player ? WIN_SCORE : -WIN_SCORE;
  const lengths = getPathLengths(state);
  const mine = lengths[player]!;
  const opponent = lengths[(player + 1) % state.players.length]!;
  return opponent - mine;
}

/** 현재 플레이어가 둘 수 있는 모든 수. 말 이동을 먼저 둬서 가지치기가 잘 되게 한다. */
export function getLegalActions(state: GameState): Action[] {
  if (state.winner !== null) return [];
  const me = state.current;
  const actions: Action[] = getPawnMoves(state, me).map((to) => ({ type: 'move', to }));

  const { size } = state.config;
  const inventory = state.players[me].inventory;
  for (const kind of WALL_KINDS) {
    if (inventory[kind] <= 0) continue;
    for (const orientation of ORIENTATIONS) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const action: Action = { type: 'wall', kind, orientation, x, y };
          if (validateAction(state, action) === null) actions.push(action);
        }
      }
    }
  }

  if (inventory.remover > 0) {
    for (const w of state.walls) {
      if (w.owner !== me) actions.push({ type: 'remove', wallId: w.id });
    }
  }
  return actions;
}

/** player 입장의 미니맥스 + 알파베타. 빨리 이길수록, 늦게 질수록 점수를 더 준다. */
function search(state: GameState, depth: number, alpha: number, beta: number, player: number): number {
  if (state.winner !== null) return evaluate(state, player) + (state.winner === player ? depth : -depth);
  if (depth === 0) return evaluate(state, player);

  const maximizing = state.current === player;
  let best = maximizing ? -Infinity : Infinity;
  for (const action of getLegalActions(state)) {
    const score = search(applyAction(state, action), depth - 1, alpha, beta, player);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (alpha >= beta) break;
  }
  return best;
}

/** 현재 플레이어에게 가장 좋은 수. 점수가 같으면 먼저 찾은 수(말 이동 우선)를 고른다. */
export function chooseAction(state: GameState, depth = 2): Action | null {
  const player = state.current;
  let bestAction: Action | null = null;
  let alpha = -Infinity;
  for (const action of getLegalActions(state)) {
    const score = search(applyAction(state, action), depth - 1, alpha, Infinity, player);
    if (score > alpha) {
      alpha = score;
      bestAction = action;
    }
  }
  return bestAction;
}
