import type { Pos, Wall } from './types.ts';

export type WallShape = Pick<Wall, 'orientation' | 'x' | 'y' | 'length'>;

/** 인접한 두 칸 사이의 홈을 나타내는 키. 순서와 무관하다. */
export function edgeKey(a: Pos, b: Pos): string {
  const [p, q] = a.y < b.y || (a.y === b.y && a.x < b.x) ? [a, b] : [b, a];
  return `${p.x},${p.y}|${q.x},${q.y}`;
}

/** 막대가 막는 홈 목록 */
export function wallEdges(w: WallShape): string[] {
  const edges: string[] = [];
  for (let i = 0; i < w.length; i++) {
    if (w.orientation === 'h') {
      edges.push(edgeKey({ x: w.x + i, y: w.y }, { x: w.x + i, y: w.y + 1 }));
    } else {
      edges.push(edgeKey({ x: w.x, y: w.y + i }, { x: w.x + 1, y: w.y + i }));
    }
  }
  return edges;
}

/**
 * 막대 내부(양 끝 제외)를 지나는 격자 교차점 목록.
 * 교차점 (cx, cy)는 열 cx-1/cx 와 행 cy-1/cy 사이의 점이다.
 */
export function wallInteriorCorners(w: WallShape): string[] {
  const corners: string[] = [];
  for (let i = 1; i < w.length; i++) {
    if (w.orientation === 'h') corners.push(`${w.x + i},${w.y + 1}`);
    else corners.push(`${w.x + 1},${w.y + i}`);
  }
  return corners;
}

export function isWallInBounds(size: number, w: WallShape): boolean {
  if (w.x < 0 || w.y < 0) return false;
  if (w.orientation === 'h') return w.y <= size - 2 && w.x + w.length <= size;
  return w.x <= size - 2 && w.y + w.length <= size;
}

/** 겹치거나 십자로 교차하면 true. 끝끼리 닿거나 T자로 만나는 것은 허용한다. */
export function wallsConflict(a: WallShape, b: WallShape): boolean {
  if (a.orientation === b.orientation) {
    const edges = new Set(wallEdges(a));
    return wallEdges(b).some((e) => edges.has(e));
  }
  const corners = new Set(wallInteriorCorners(a));
  return wallInteriorCorners(b).some((c) => corners.has(c));
}

export function buildBlockedEdges(walls: readonly WallShape[]): Set<string> {
  const blocked = new Set<string>();
  for (const w of walls) for (const e of wallEdges(w)) blocked.add(e);
  return blocked;
}
