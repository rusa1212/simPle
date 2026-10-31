import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, createGame, getPathLengths, validateAction } from './game.ts';
import { chooseAction } from './ai.ts';
import { DEFAULT_CONFIG } from './config.ts';
import { BASIC_VARIANT, BOARD_PRESETS, variantConfig } from './variants.ts';
import type { BoardSize } from './variants.ts';

test('기본 확장 규칙은 기본 게임과 같다', () => {
  assert.deepEqual(createGame(variantConfig(BASIC_VARIANT)), createGame());
});

for (const size of [7, 11] as BoardSize[]) {
  test(`${size}×${size}: 가운데에서 시작하고 반대편 끝 줄이 목표다`, () => {
    const game = createGame(variantConfig({ size }));
    const mid = (size - 1) / 2;
    assert.equal(game.config.size, size);
    assert.deepEqual(game.players[0].pos, { x: mid, y: 0 });
    assert.deepEqual(game.players[1].pos, { x: mid, y: size - 1 });
    assert.deepEqual(game.players[0].goal, { axis: 'y', value: size - 1 });
    assert.deepEqual(getPathLengths(game), [size - 1, size - 1]);
    assert.deepEqual(game.players[0].inventory, BOARD_PRESETS[size].inventory);
  });

  test(`${size}×${size}: 보드 끝 홈까지만 막대를 놓을 수 있다`, () => {
    const game = createGame(variantConfig({ size }));
    const wall = (x: number, y: number) => ({ type: 'wall', kind: 'normal', orientation: 'h', x, y }) as const;
    assert.equal(validateAction(game, wall(size - 2, size - 2)), null);
    assert.equal(validateAction(game, wall(size - 1, 0)), '보드 밖입니다');
    assert.equal(validateAction(game, wall(0, size - 1)), '보드 밖입니다');
  });
}

test('11×11에서도 AI가 수를 고른다', () => {
  let game = createGame(variantConfig({ size: 11 }));
  game = applyAction(game, { type: 'move', to: { x: 5, y: 1 } });
  const action = chooseAction(game, 2);
  assert.ok(action);
  assert.equal(validateAction(game, action), null);
});

test('프리셋이 기본 설정을 바꾸지 않는다', () => {
  const before = structuredClone(DEFAULT_CONFIG);
  const game = createGame(variantConfig({ size: 7 }));
  game.players[0].inventory.normal = 0;
  assert.deepEqual(DEFAULT_CONFIG, before);
});
