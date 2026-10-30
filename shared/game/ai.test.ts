import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, createGame } from './game.ts';
import { evaluate, WIN_SCORE } from './ai.ts';

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
