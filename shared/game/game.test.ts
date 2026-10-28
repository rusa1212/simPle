import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Action, GameState, Pos, Wall } from './types.ts';
import { applyAction, createGame, getPathLengths, validateAction } from './game.ts';
import { getPawnMoves } from './moves.ts';

const sortPos = (ps: Pos[]) => ps.map((p) => `${p.x},${p.y}`).sort();

function withPositions(state: GameState, a: Pos, b: Pos): GameState {
  return {
    ...state,
    players: [
      { ...state.players[0], pos: a },
      { ...state.players[1], pos: b },
    ],
  };
}

function withWalls(state: GameState, walls: Omit<Wall, 'id'>[]): GameState {
  return { ...state, walls: walls.map((w, i) => ({ ...w, id: 100 + i })) };
}

const wall = (orientation: 'h' | 'v', x: number, y: number, owner = 1): Omit<Wall, 'id'> => ({
  kind: 'normal',
  orientation,
  x,
  y,
  length: 2,
  owner,
  expiresAt: null,
});

test('시작 위치와 목표 줄', () => {
  const s = createGame();
  assert.deepEqual(s.players[0].pos, { x: 4, y: 0 });
  assert.deepEqual(s.players[1].pos, { x: 4, y: 8 });
  assert.deepEqual(getPathLengths(s), [8, 8]);
  assert.equal(s.current, 0);
});

test('보드 크기를 바꾸면 시작 위치도 가운데로 맞춰진다', () => {
  const s = createGame({ size: 7 });
  assert.deepEqual(s.players[0].pos, { x: 3, y: 0 });
  assert.deepEqual(s.players[1].pos, { x: 3, y: 6 });
});

// --- 막대 설치 검증 ---

test('막대 설치: 정상 설치 시 개수가 줄고 턴이 넘어간다', () => {
  const s = applyAction(createGame(), { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 3 });
  assert.equal(s.walls.length, 1);
  assert.equal(s.walls[0].owner, 0);
  assert.equal(s.players[0].inventory.normal, 5);
  assert.equal(s.players[1].inventory.normal, 6);
  assert.equal(s.current, 1);
});

test('막대 설치: 남은 개수가 없으면 거부', () => {
  const s = createGame({ inventory: { normal: 0, long: 0, temp: 0, remover: 0 } });
  const action: Action = { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 3 };
  assert.equal(validateAction(s, action), '남은 막대가 없습니다');
});

test('막대 설치: 보드 밖이나 겹치는 자리는 거부', () => {
  let s = createGame();
  assert.equal(
    validateAction(s, { type: 'wall', kind: 'long', orientation: 'h', x: 7, y: 0 }),
    '보드 밖입니다',
  );
  s = applyAction(s, { type: 'wall', kind: 'normal', orientation: 'h', x: 3, y: 3 });
  assert.equal(
    validateAction(s, { type: 'wall', kind: 'normal', orientation: 'v', x: 3, y: 3 }),
    '다른 막대와 겹칩니다',
  );
});

test('막대 설치: 한 줄을 완전히 막는 막대는 거부', () => {
  // 3×3 보드에서 긴 막대 하나면 가로줄 전체가 막힌다
  const s = createGame({ size: 3 });
  assert.equal(
    validateAction(s, { type: 'wall', kind: 'long', orientation: 'h', x: 0, y: 0 }),
    '목표 줄로 가는 길을 완전히 막을 수 없습니다',
  );
  assert.equal(
    validateAction(s, { type: 'wall', kind: 'long', orientation: 'h', x: 0, y: 1 }),
    '목표 줄로 가는 길을 완전히 막을 수 없습니다',
  );
});

test('막대 설치: 한 플레이어만 갇혀도 거부', () => {
  // A를 (0,0) 구석에 두고 오른쪽과 위를 막은 상태에서 마지막 구멍을 막는다
  let s = withPositions(createGame(), { x: 0, y: 0 }, { x: 4, y: 8 });
  s = withWalls(s, [wall('v', 0, 0)]); // (0,0),(0,1) 오른쪽 막힘
  const seal: Action = { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 1 };
  // (0,1) 위가 막히면 A는 (0,0)~(0,1) 안에 갇힌다
  assert.equal(validateAction(s, seal), '목표 줄로 가는 길을 완전히 막을 수 없습니다');
  // 막대 하나 옆이면 통로가 남아 허용
  assert.equal(validateAction(s, { ...seal, y: 2 }), null);
});

test('막대 설치: 길을 돌아가게 만드는 것은 허용하고 최단 거리가 늘어난다', () => {
  const s = applyAction(createGame(), { type: 'wall', kind: 'long', orientation: 'h', x: 3, y: 7 });
  const [, b] = getPathLengths(s);
  assert.equal(b, 10);
});

// --- 임시 막대와 철거 도구 ---

test('임시 막대: 설정한 수만큼 지나면 사라지고 길이 다시 열린다', () => {
  let s = createGame({ tempWallDuration: 4 });
  s = applyAction(s, { type: 'wall', kind: 'temp', orientation: 'h', x: 3, y: 7 });
  assert.equal(s.walls[0].expiresAt, 4);
  const pass = (st: GameState) => {
    const p = st.players[st.current].pos;
    const to = { x: p.x === 0 ? 1 : p.x - 1, y: p.y };
    return applyAction(st, { type: 'move', to });
  };
  s = pass(s); // turn 2
  s = pass(s); // turn 3
  assert.equal(s.walls.length, 1);
  s = pass(s); // turn 4
  assert.equal(s.walls.length, 0);
  assert.equal(s.players[0].inventory.temp, 1);
});

test('철거 도구: 상대 막대만 철거할 수 있고 한 번 쓰면 사라진다', () => {
  let s = createGame();
  s = applyAction(s, { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 3 }); // A의 막대
  const wallId = s.walls[0].id;
  s = applyAction(s, { type: 'wall', kind: 'normal', orientation: 'h', x: 4, y: 3 }); // B의 막대
  const bWallId = s.walls[1].id;

  assert.equal(validateAction(s, { type: 'remove', wallId }), '상대 막대만 철거할 수 있습니다');
  assert.equal(validateAction(s, { type: 'remove', wallId: 999 }), '없는 막대입니다');

  s = applyAction(s, { type: 'remove', wallId: bWallId });
  assert.deepEqual(s.walls.map((w) => w.id), [wallId]);
  assert.equal(s.players[0].inventory.remover, 0);

  s = applyAction(s, { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 6 }); // B의 막대
  const lastB = s.walls.at(-1)!.id;
  assert.equal(validateAction(s, { type: 'remove', wallId: lastB }), '철거 도구가 없습니다');
});

// --- 이동과 점프 ---

test('이동: 상하좌우 1칸, 막대와 보드 끝은 지날 수 없다', () => {
  let s = createGame();
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,0', '4,1', '5,0']);
  s = withWalls(s, [wall('h', 4, 0)]);
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,0', '5,0']);
  assert.equal(validateAction(s, { type: 'move', to: { x: 4, y: 1 } }), '이동할 수 없는 칸입니다');
  assert.equal(validateAction(s, { type: 'move', to: { x: 4, y: 2 } }), '이동할 수 없는 칸입니다');
});

test('점프: 마주 보면 상대 말을 뛰어넘는다', () => {
  const s = withPositions(createGame(), { x: 4, y: 4 }, { x: 4, y: 5 });
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,4', '4,3', '4,6', '5,4']);
});

test('점프: 상대 뒤가 막대로 막히면 대각선으로 비켜 간다', () => {
  let s = withPositions(createGame(), { x: 4, y: 4 }, { x: 4, y: 5 });
  s = withWalls(s, [wall('h', 4, 5)]);
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,4', '3,5', '4,3', '5,4', '5,5']);
});

test('점프: 상대 뒤가 보드 끝이면 대각선으로 비켜 간다', () => {
  const s = withPositions(createGame(), { x: 4, y: 7 }, { x: 4, y: 8 });
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,7', '3,8', '4,6', '5,7', '5,8']);
});

test('점프: 대각선 쪽도 막대로 막혀 있으면 그쪽으로는 갈 수 없다', () => {
  let s = withPositions(createGame(), { x: 4, y: 4 }, { x: 4, y: 5 });
  s = withWalls(s, [wall('h', 3, 5), wall('v', 4, 5)]);
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,4', '3,5', '4,3', '5,4']);
});

test('점프: 상대와 나 사이에 막대가 있으면 점프할 수 없다', () => {
  let s = withPositions(createGame(), { x: 4, y: 4 }, { x: 4, y: 5 });
  s = withWalls(s, [wall('h', 3, 4)]);
  assert.deepEqual(sortPos(getPawnMoves(s, 0)), ['3,4', '4,3', '5,4']);
});

// --- 승리 판정과 불변성 ---

test('승리: 목표 줄에 도착하면 승리하고 이후 수는 거부된다', () => {
  let s = withPositions(createGame(), { x: 0, y: 7 }, { x: 4, y: 8 });
  s = applyAction(s, { type: 'move', to: { x: 0, y: 8 } });
  assert.equal(s.winner, 0);
  assert.equal(validateAction(s, { type: 'move', to: { x: 3, y: 8 } }), '게임이 끝났습니다');
});

test('점프로 목표 줄에 도착해도 승리', () => {
  let s = withPositions(createGame(), { x: 4, y: 6 }, { x: 4, y: 7 });
  s = applyAction(s, { type: 'move', to: { x: 4, y: 8 } });
  assert.equal(s.winner, 0);
});

test('applyAction은 원래 상태를 바꾸지 않는다', () => {
  const s = createGame();
  const snapshot = structuredClone(s);
  applyAction(s, { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 3 });
  applyAction(s, { type: 'move', to: { x: 4, y: 1 } });
  assert.deepEqual(s, snapshot);
});

test('잘못된 수는 이유와 함께 예외를 던진다', () => {
  assert.throws(
    () => applyAction(createGame(), { type: 'move', to: { x: 0, y: 0 } }),
    /이동할 수 없는 칸입니다/,
  );
});
