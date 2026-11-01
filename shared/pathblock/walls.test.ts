import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBlockedEdges, edgeKey, isWallInBounds, wallsConflict } from './walls.ts';

const h = (x: number, y: number, length = 2) => ({ orientation: 'h' as const, x, y, length });
const v = (x: number, y: number, length = 2) => ({ orientation: 'v' as const, x, y, length });

test('보드 범위: 막대 끝이 보드 끝에 맞닿는 것까지 허용', () => {
  assert.equal(isWallInBounds(9, h(7, 0)), true);
  assert.equal(isWallInBounds(9, h(8, 0)), false);
  assert.equal(isWallInBounds(9, h(0, 7)), true);
  assert.equal(isWallInBounds(9, h(0, 8)), false);
  assert.equal(isWallInBounds(9, v(7, 7)), true);
  assert.equal(isWallInBounds(9, v(8, 0)), false);
  assert.equal(isWallInBounds(9, v(0, 8)), false);
  assert.equal(isWallInBounds(9, h(-1, 0)), false);
});

test('보드 범위: 긴 막대는 3칸 기준으로 판정', () => {
  assert.equal(isWallInBounds(9, h(6, 0, 3)), true);
  assert.equal(isWallInBounds(9, h(7, 0, 3)), false);
  assert.equal(isWallInBounds(9, v(0, 7, 3)), false);
});

test('같은 방향 막대: 같은 자리나 일부가 겹치면 충돌', () => {
  assert.equal(wallsConflict(h(3, 3), h(3, 3)), true);
  assert.equal(wallsConflict(h(3, 3), h(4, 3)), true);
  assert.equal(wallsConflict(v(3, 3), v(3, 4)), true);
  assert.equal(wallsConflict(h(2, 3, 3), h(4, 3)), true);
});

test('같은 방향 막대: 끝끼리 이어 붙이거나 평행하게 두는 것은 허용', () => {
  assert.equal(wallsConflict(h(3, 3), h(5, 3)), false);
  assert.equal(wallsConflict(v(3, 3), v(3, 5)), false);
  assert.equal(wallsConflict(h(3, 3), h(3, 4)), false);
});

test('가로세로 막대: 가운데에서 십자로 교차하면 충돌', () => {
  assert.equal(wallsConflict(h(3, 3), v(3, 3)), true);
  assert.equal(wallsConflict(h(2, 3, 3), v(3, 3)), true);
  assert.equal(wallsConflict(h(2, 3, 3), v(2, 3)), true);
});

test('가로세로 막대: T자로 만나거나 모서리만 닿으면 허용', () => {
  assert.equal(wallsConflict(h(3, 3), v(4, 3)), false);
  assert.equal(wallsConflict(h(3, 3), v(3, 4)), false);
  assert.equal(wallsConflict(h(3, 3), v(2, 3)), false);
});

test('막힌 홈: 가로 막대는 위아래 이동을, 세로 막대는 좌우 이동을 막는다', () => {
  const blocked = buildBlockedEdges([h(3, 3), v(0, 0, 3)]);
  assert.ok(blocked.has(edgeKey({ x: 3, y: 3 }, { x: 3, y: 4 })));
  assert.ok(blocked.has(edgeKey({ x: 4, y: 4 }, { x: 4, y: 3 })));
  assert.ok(!blocked.has(edgeKey({ x: 5, y: 3 }, { x: 5, y: 4 })));
  assert.ok(blocked.has(edgeKey({ x: 0, y: 2 }, { x: 1, y: 2 })));
  assert.ok(!blocked.has(edgeKey({ x: 0, y: 3 }, { x: 1, y: 3 })));
});
