import type { Goal, Pos } from './types.ts';
import { edgeKey } from './walls.ts';

export const DIRECTIONS: readonly Pos[] = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];

export function inBounds(size: number, p: Pos): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
}

/** 인접한 두 칸 사이를 막대 없이 지날 수 있는지 */
export function canStep(size: number, blocked: Set<string>, from: Pos, to: Pos): boolean {
  return inBounds(size, to) && !blocked.has(edgeKey(from, to));
}

export function isAtGoal(pos: Pos, goal: Goal): boolean {
  return pos[goal.axis] === goal.value;
}

/** 말을 무시하고 막대만 고려한 최단 거리. 도달할 수 없으면 null. */
export function shortestPathLength(
  size: number,
  blocked: Set<string>,
  from: Pos,
  goal: Goal,
): number | null {
  const path = shortestPath(size, blocked, from, goal);
  return path === null ? null : path.length - 1;
}

/** 말을 무시하고 막대만 고려한 최단 경로 하나 (출발 칸과 도착 칸 포함). 도달할 수 없으면 null. */
export function shortestPath(size: number, blocked: Set<string>, from: Pos, goal: Goal): Pos[] | null {
  const prev = new Map<string, Pos | null>([[`${from.x},${from.y}`, null]]);
  const queue: Pos[] = [from];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (isAtGoal(cur, goal)) {
      const path: Pos[] = [];
      for (let p: Pos | null = cur; p !== null; p = prev.get(`${p.x},${p.y}`)!) path.push(p);
      return path.reverse();
    }
    for (const dir of DIRECTIONS) {
      const next = { x: cur.x + dir.x, y: cur.y + dir.y };
      const key = `${next.x},${next.y}`;
      if (prev.has(key) || !canStep(size, blocked, cur, next)) continue;
      prev.set(key, cur);
      queue.push(next);
    }
  }
  return null;
}
