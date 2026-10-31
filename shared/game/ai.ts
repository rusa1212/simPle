import type { Action, GameState, Orientation, Pos, WallKind } from './types.ts';
import { WALL_LENGTH } from './config.ts';
import { applyAction, getPathLengths, validateAction } from './game.ts';
import { getPawnMoves } from './moves.ts';
import { shortestPath } from './path.ts';
import { buildBlockedEdges } from './walls.ts';

/** 승패가 갈린 상태의 점수. 경로 길이 차이로는 나올 수 없는 큰 값이다. */
export const WIN_SCORE = 10000;

const WALL_KINDS: readonly WallKind[] = ['normal', 'long', 'temp'];
const ORIENTATIONS: readonly Orientation[] = ['h', 'v'];

/**
 * player 입장에서 본 점수: 가장 앞선 상대의 최단 경로 길이 − 내 최단 경로 길이. 클수록 유리하다.
 * 4인에서는 상대 셋이 모두 나를 견제한다고 보고(미니맥스에서 상대 차례는 모두 최소화) 가장 위험한 상대만 본다.
 */
export function evaluate(state: GameState, player: number): number {
  if (state.winner !== null) return state.winner === player ? WIN_SCORE : -WIN_SCORE;
  const lengths = getPathLengths(state) as number[];
  const opponent = Math.min(...lengths.filter((_, i) => i !== player));
  return opponent - lengths[player];
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

/** 홈 하나를 막을 수 있는 막대 자리들 (보드 밖 자리도 포함, 검증은 호출하는 쪽에서) */
function wallSpotsCovering(a: Pos, b: Pos, length: number): { orientation: Orientation; x: number; y: number }[] {
  const spots: { orientation: Orientation; x: number; y: number }[] = [];
  const lo = a.x + a.y < b.x + b.y ? a : b;
  for (let i = 0; i < length; i++) {
    // 위아래로 붙은 칸 사이는 가로 막대, 좌우로 붙은 칸 사이는 세로 막대가 막는다
    if (a.x === b.x) spots.push({ orientation: 'h', x: lo.x - i, y: lo.y });
    else spots.push({ orientation: 'v', x: lo.x, y: lo.y - i });
  }
  return spots;
}

/**
 * 탐색용 후보 수. 말 이동과 철거는 전부, 막대는 양쪽 최단 경로의 홈을 막는 자리만 남긴다.
 * 최단 경로를 하나도 건드리지 않는 막대는 당장 어느 쪽 경로 길이도 바꾸지 못하기 때문이다.
 */
export function getCandidateActions(state: GameState): Action[] {
  if (state.winner !== null) return [];
  const me = state.current;
  const actions: Action[] = getPawnMoves(state, me).map((to) => ({ type: 'move', to }));

  const { size } = state.config;
  const blocked = buildBlockedEdges(state.walls);
  const pathEdges: [Pos, Pos][] = [];
  for (const p of state.players) {
    const path = shortestPath(size, blocked, p.pos, p.goal) ?? [];
    for (let i = 1; i < path.length; i++) pathEdges.push([path[i - 1], path[i]]);
  }

  const inventory = state.players[me].inventory;
  const seen = new Set<string>();
  for (const kind of WALL_KINDS) {
    if (inventory[kind] <= 0) continue;
    for (const [a, b] of pathEdges) {
      for (const spot of wallSpotsCovering(a, b, WALL_LENGTH[kind])) {
        const key = `${kind},${spot.orientation},${spot.x},${spot.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const action: Action = { type: 'wall', kind, ...spot };
        if (validateAction(state, action) === null) actions.push(action);
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
  for (const action of getCandidateActions(state)) {
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
  for (const action of getCandidateActions(state)) {
    const score = search(applyAction(state, action), depth - 1, alpha, Infinity, player);
    if (score > alpha) {
      alpha = score;
      bestAction = action;
    }
  }
  return bestAction;
}
