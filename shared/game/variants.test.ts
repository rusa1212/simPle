import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, createGame, getPathLengths, validateAction, viewFor } from './game.ts';
import { getPawnMoves } from './moves.ts';
import { chooseAction } from './ai.ts';
import { DEFAULT_CONFIG } from './config.ts';
import { BASIC_VARIANT, BOARD_PRESETS, FOUR_PLAYER_INVENTORY, variantConfig } from './variants.ts';
import type { BoardSize } from './variants.ts';
import type { Action, GameState, Pos, Wall } from './types.ts';

test('기본 확장 규칙은 기본 게임과 같다', () => {
  assert.deepEqual(createGame(variantConfig(BASIC_VARIANT)), createGame());
});

for (const size of [7, 11] as BoardSize[]) {
  test(`${size}×${size}: 가운데에서 시작하고 반대편 끝 줄이 목표다`, () => {
    const game = createGame(variantConfig({ ...BASIC_VARIANT, size }));
    const mid = (size - 1) / 2;
    assert.equal(game.config.size, size);
    assert.deepEqual(game.players[0].pos, { x: mid, y: 0 });
    assert.deepEqual(game.players[1].pos, { x: mid, y: size - 1 });
    assert.deepEqual(game.players[0].goal, { axis: 'y', value: size - 1 });
    assert.deepEqual(getPathLengths(game), [size - 1, size - 1]);
    assert.deepEqual(game.players[0].inventory, BOARD_PRESETS[size].inventory);
  });

  test(`${size}×${size}: 보드 끝 홈까지만 막대를 놓을 수 있다`, () => {
    const game = createGame(variantConfig({ ...BASIC_VARIANT, size }));
    const wall = (x: number, y: number) => ({ type: 'wall', kind: 'normal', orientation: 'h', x, y }) as const;
    assert.equal(validateAction(game, wall(size - 2, size - 2)), null);
    assert.equal(validateAction(game, wall(size - 1, 0)), '보드 밖입니다');
    assert.equal(validateAction(game, wall(0, size - 1)), '보드 밖입니다');
  });
}

test('11×11에서도 AI가 수를 고른다', () => {
  let game = createGame(variantConfig({ ...BASIC_VARIANT, size: 11 }));
  game = applyAction(game, { type: 'move', to: { x: 5, y: 1 } });
  const action = chooseAction(game, 2);
  assert.ok(action);
  assert.equal(validateAction(game, action), null);
});

test('프리셋이 기본 설정을 바꾸지 않는다', () => {
  const before = structuredClone(DEFAULT_CONFIG);
  const game = createGame(variantConfig({ ...BASIC_VARIANT, size: 7 }));
  game.players[0].inventory.normal = 0;
  assert.deepEqual(DEFAULT_CONFIG, before);
});

// 안개 모드. A(4,0)가 B(4,8) 바로 앞 홈에 막대를 놓고 시작한다.
const fogGame = () => createGame(variantConfig({ ...BASIC_VARIANT, fog: true }));
const blockB: Action = { type: 'wall', kind: 'normal', orientation: 'h', x: 4, y: 7 };
const play = (state: GameState, ...actions: Action[]) => actions.reduce(applyAction, state);
const step = (x: number, y: number): Action => ({ type: 'move', to: { x, y } });

test('안개 모드가 아니면 막대가 처음부터 보인다', () => {
  const game = play(createGame(), blockB);
  assert.equal(game.walls[0].hiddenUntil, null);
  assert.equal(viewFor(game, 1), game);
});

test('안개: 상대 막대는 정해진 수 동안 보이지 않고, 내 막대는 보인다', () => {
  let game = play(fogGame(), blockB);
  assert.equal(viewFor(game, 0).walls.length, 1);
  assert.equal(viewFor(game, 1).walls.length, 0);
  // B의 두 번째 차례까지 보이지 않고, 4수가 지나면 보인다
  game = play(game, step(3, 8), step(4, 1));
  assert.equal(viewFor(game, 1).walls.length, 0);
  game = play(game, step(2, 8));
  assert.equal(game.turn, 4);
  assert.equal(viewFor(game, 1).walls.length, 1);
});

test('안개: 보이지 않는 막대에 막힌 이동은 막대를 드러내고 차례만 넘긴다', () => {
  const game = play(fogGame(), blockB);
  assert.equal(validateAction(game, step(4, 7)), null);
  const after = applyAction(game, step(4, 7));
  assert.deepEqual(after.players[1].pos, { x: 4, y: 8 });
  assert.equal(after.current, 0);
  assert.equal(after.turn, 2);
  assert.deepEqual(after.lastBump, [game.walls[0].id]);
  assert.equal(viewFor(after, 1).walls.length, 1);
  assert.equal(applyAction(after, step(4, 1)).lastBump, null);
});

test('안개: 보이지 않는 막대와 겹치는 설치는 막대를 소모하지 않고 차례만 넘긴다', () => {
  const game = play(fogGame(), blockB);
  const overlap: Action = { type: 'wall', kind: 'normal', orientation: 'h', x: 5, y: 7 };
  const after = applyAction(game, overlap);
  assert.equal(after.walls.length, 1);
  assert.equal(after.players[1].inventory.normal, game.players[1].inventory.normal);
  assert.deepEqual(after.lastBump, [game.walls[0].id]);
});

test('안개: 보이지 않는 막대 때문에 길이 완전히 막히는 설치도 부딪힌 것으로 처리한다', () => {
  // y=3 위 홈을 A가 왼쪽 2칸, B가 가운데 5칸 막아 두었다. B의 막대는 A에게 아직 보이지 않는다.
  const hWall = (kind: 'normal' | 'long', x: number): Action => ({ type: 'wall', kind, orientation: 'h', x, y: 3 });
  const game = play(fogGame(), hWall('normal', 0), hWall('long', 2), step(4, 1), hWall('normal', 5));
  assert.equal(viewFor(game, 0).walls.length, 1);
  // A 눈에는 남은 오른쪽 2칸을 막아도 길이 있어 보이지만, 실제로는 길이 완전히 막힌다
  const seal = hWall('normal', 7);
  assert.equal(validateAction(game, seal), null);
  const after = applyAction(game, seal);
  assert.equal(after.walls.length, 3);
  assert.equal(after.players[0].inventory.normal, game.players[0].inventory.normal);
  // 하나만으로는 막히지 않으므로 숨은 막대가 모두 드러난다
  assert.deepEqual(after.lastBump?.sort(), [game.walls[1].id, game.walls[2].id].sort());
});

test('안개: 보이지 않는 막대는 철거할 수 없다', () => {
  const game = play(fogGame(), blockB);
  assert.equal(validateAction(game, { type: 'remove', wallId: game.walls[0].id }), '없는 막대입니다');
});

test('안개: AI는 자기에게 보이는 상태로 수를 골라도 실제 게임에 둘 수 있다', () => {
  const game = play(fogGame(), blockB);
  const action = chooseAction(viewFor(game, 1), 2);
  assert.ok(action);
  assert.doesNotThrow(() => applyAction(game, action));
});

// 4인 모드 (9×9)
const fourGame = () => createGame(variantConfig({ ...BASIC_VARIANT, players: 4 }));

function withPositions(state: GameState, ...positions: Pos[]): GameState {
  return { ...state, players: state.players.map((p, i) => ({ ...p, pos: positions[i] })) };
}

const vWall = (x: number, y: number, length: number, owner: number, id: number): Wall => ({
  id,
  kind: length === 3 ? 'long' : 'normal',
  orientation: 'v',
  x,
  y,
  length,
  owner,
  expiresAt: null,
  hiddenUntil: null,
});

test('4인: 네 변의 가운데에서 출발해 반대편 변이 목표다', () => {
  const game = fourGame();
  assert.deepEqual(
    game.players.map((p) => [p.pos, p.goal]),
    [
      [{ x: 4, y: 0 }, { axis: 'y', value: 8 }],
      [{ x: 4, y: 8 }, { axis: 'y', value: 0 }],
      [{ x: 0, y: 4 }, { axis: 'x', value: 8 }],
      [{ x: 8, y: 4 }, { axis: 'x', value: 0 }],
    ],
  );
  assert.deepEqual(game.players[2].inventory, FOUR_PLAYER_INVENTORY[9]);
  assert.deepEqual(getPathLengths(game), [8, 8, 8, 8]);
});

test('4인: 차례는 A → B → C → D → A 순서로 돈다', () => {
  const game = play(fourGame(), step(4, 1), step(4, 7), step(1, 4), step(7, 4));
  assert.equal(game.current, 0);
  assert.equal(game.turn, 4);
});

test('4인: 오른쪽 변에 도착한 C가 이긴다', () => {
  let game = withPositions(fourGame(), { x: 4, y: 0 }, { x: 4, y: 8 }, { x: 7, y: 2 }, { x: 8, y: 4 });
  game = { ...game, current: 2 };
  const after = applyAction(game, step(8, 2));
  assert.equal(after.winner, 2);
});

test('4인: 가로로 가는 C의 길을 완전히 막는 막대도 놓을 수 없다', () => {
  // C(0,4)의 오른쪽 홈을 아래부터 막아 맨 위 한 줄만 남겨 둔다
  const game = { ...fourGame(), walls: [vWall(0, 0, 2, 1, 1), vWall(0, 2, 2, 1, 2), vWall(0, 4, 2, 1, 3)] };
  const seal: Action = { type: 'wall', kind: 'long', orientation: 'v', x: 0, y: 6 };
  assert.equal(validateAction(game, seal), '목표 줄로 가는 길을 완전히 막을 수 없습니다');
});

test('4인: 뛰어넘을 칸에도 말이 있으면 대각선으로 비켜 간다', () => {
  const game = withPositions(fourGame(), { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 8, y: 4 });
  const moves = getPawnMoves(game, 0).map((p) => `${p.x},${p.y}`).sort();
  assert.deepEqual(moves, ['3,4', '3,5', '4,3', '5,4', '5,5']);
});

test('4인: 철거 도구는 다른 세 플레이어의 막대 모두에 쓸 수 있다', () => {
  const game = { ...fourGame(), walls: [vWall(2, 0, 2, 0, 1), vWall(4, 0, 2, 3, 2)] };
  assert.equal(validateAction(game, { type: 'remove', wallId: 1 }), '상대 막대만 철거할 수 있습니다');
  assert.equal(validateAction(game, { type: 'remove', wallId: 2 }), null);
});

test('4인: 임시 막대와 안개 시간은 각자의 차례 기준으로 2인과 같다', () => {
  const config = variantConfig({ ...BASIC_VARIANT, players: 4, fog: true });
  assert.equal(config.tempWallDuration, 12);
  assert.equal(config.fogDuration, 8);
  assert.equal(variantConfig({ ...BASIC_VARIANT, fog: true }).fogDuration, 4);
});

test('4인: AI가 수를 고른다', () => {
  const game = play(fourGame(), step(4, 1));
  // 4인은 후보 수가 많아서 화면에서는 깊이 1~2만 쓴다
  for (const depth of [1, 2]) {
    const action = chooseAction(game, depth);
    assert.ok(action);
    assert.equal(validateAction(game, action), null);
  }
});
