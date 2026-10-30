import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GameState, Pos } from './types.ts';
import { applyAction, createGame } from './game.ts';
import { chooseAction, evaluate, getLegalActions, WIN_SCORE } from './ai.ts';

test('평가 함수: 시작 상태는 양쪽 모두 0점', () => {
  const s = createGame();
  assert.equal(evaluate(s, 0), 0);
  assert.equal(evaluate(s, 1), 0);
});

test('평가 함수: 앞으로 가면 내 점수는 오르고 상대 점수는 내려간다', () => {
  const s = applyAction(createGame(), { type: 'move', to: { x: 4, y: 1 } });
  assert.equal(evaluate(s, 0), 1);
  assert.equal(evaluate(s, 1), -1);
});

test('평가 함수: 상대 길을 막대로 돌아가게 하면 점수가 오른다', () => {
  // A는 왼쪽 끝 열에 두고, B(4,8) 바로 아래를 긴 막대로 막아 B만 옆으로 2칸 돌아가게 한다
  const start = createGame();
  const before = { ...start, players: [{ ...start.players[0], pos: { x: 0, y: 0 } }, start.players[1]] };
  const s = applyAction(before, { type: 'wall', kind: 'long', orientation: 'h', x: 3, y: 7 });
  assert.equal(evaluate(before, 0), 0);
  assert.equal(evaluate(s, 0), 2);
  assert.equal(evaluate(s, 1), -2);
});

test('평가 함수: 승패가 갈리면 WIN_SCORE', () => {
  const s = createGame();
  const won = {
    ...s,
    players: [{ ...s.players[0], pos: { x: 4, y: 8 } }, { ...s.players[1], pos: { x: 0, y: 4 } }],
    winner: 0,
  };
  assert.equal(evaluate(won, 0), WIN_SCORE);
  assert.equal(evaluate(won, 1), -WIN_SCORE);
});

// --- 수 생성과 탐색 ---

function withPositions(state: GameState, a: Pos, b: Pos): GameState {
  return {
    ...state,
    players: [
      { ...state.players[0], pos: a },
      { ...state.players[1], pos: b },
    ],
  };
}

test('수 생성: 시작 상태는 말 이동 3개 + 설치 가능한 막대 자리 전부', () => {
  // 일반·임시: 8×8×2방향 = 128씩, 긴 막대: 7×8×2방향 = 112
  const actions = getLegalActions(createGame());
  assert.equal(actions.filter((a) => a.type === 'move').length, 3);
  assert.equal(actions.filter((a) => a.type === 'wall').length, 128 + 112 + 128);
  assert.equal(actions.filter((a) => a.type === 'remove').length, 0);
});

test('수 생성: 철거 도구는 상대 막대에만 쓴다', () => {
  let s = applyAction(createGame(), { type: 'wall', kind: 'normal', orientation: 'h', x: 0, y: 3 });
  s = applyAction(s, { type: 'wall', kind: 'normal', orientation: 'h', x: 4, y: 3 });
  const removes = getLegalActions(s).filter((a) => a.type === 'remove');
  // 다시 A 차례: A가 철거할 수 있는 건 B가 둔 2번 막대뿐이다
  assert.deepEqual(removes, [{ type: 'remove', wallId: 2 }]);
});

test('탐색: 한 수로 이길 수 있으면 바로 이긴다', () => {
  const s = withPositions(createGame(), { x: 0, y: 7 }, { x: 8, y: 8 });
  assert.deepEqual(chooseAction(s, 2), { type: 'move', to: { x: 0, y: 8 } });
});

test('탐색: 상대가 다음 수에 이기면 막대로 막는다', () => {
  // A 차례, B는 (0,1)에서 한 칸만 내려가면 이긴다
  const s = withPositions(createGame(), { x: 8, y: 4 }, { x: 0, y: 1 });
  const action = chooseAction(s, 2)!;
  assert.equal(action.type, 'wall');
  const after = applyAction(s, action);
  for (const reply of getLegalActions(after)) {
    assert.equal(applyAction(after, reply).winner, null);
  }
});
