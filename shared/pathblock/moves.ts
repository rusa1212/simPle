import type { GameState, Pos } from './types.ts';
import { DIRECTIONS, canStep } from './path.ts';
import { buildBlockedEdges } from './walls.ts';

/**
 * 말이 이동할 수 있는 칸 목록.
 * 바로 옆에 다른 말이 있으면 뛰어넘고, 그 뒤가 막혀 있으면 대각선으로 비켜 간다.
 */
export function getPawnMoves(state: GameState, playerIndex: number): Pos[] {
  const { size } = state.config;
  const blocked = buildBlockedEdges(state.walls);
  const from = state.players[playerIndex].pos;
  const occupied = (p: Pos) =>
    state.players.some((pl, i) => i !== playerIndex && pl.pos.x === p.x && pl.pos.y === p.y);

  const result = new Map<string, Pos>();
  const add = (p: Pos) => result.set(`${p.x},${p.y}`, p);

  for (const d of DIRECTIONS) {
    const next = { x: from.x + d.x, y: from.y + d.y };
    if (!canStep(size, blocked, from, next)) continue;
    if (!occupied(next)) {
      add(next);
      continue;
    }
    const jump = { x: next.x + d.x, y: next.y + d.y };
    if (canStep(size, blocked, next, jump) && !occupied(jump)) {
      add(jump);
      continue;
    }
    for (const side of [{ x: d.y, y: d.x }, { x: -d.y, y: -d.x }]) {
      const diag = { x: next.x + side.x, y: next.y + side.y };
      if (canStep(size, blocked, next, diag) && !occupied(diag)) add(diag);
    }
  }
  return [...result.values()];
}
