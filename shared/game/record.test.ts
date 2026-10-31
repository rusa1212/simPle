import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Action } from './types.ts';
import { applyAction, createGame } from './game.ts';
import { BASIC_VARIANT, variantConfig } from './variants.ts';
import { createRecord, loadRecord, replay } from './record.ts';

const step = (x: number, y: number): Action => ({ type: 'move', to: { x, y } });

// 막대 설치, 철거, 임시 막대, 승리까지 들어간 짧은 게임
const actions: Action[] = [
  { type: 'wall', kind: 'temp', orientation: 'h', x: 3, y: 6 },
  { type: 'wall', kind: 'normal', orientation: 'h', x: 3, y: 1 },
  { type: 'remove', wallId: 2 },
  step(4, 7),
  step(4, 1),
];

/** JSON 파일로 저장했다가 읽은 것처럼 만든다 */
const roundTrip = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

test('기보: 저장한 기보를 읽으면 같은 상태가 나온다', () => {
  const config = createGame().config;
  const record = createRecord(config, actions, new Date('2026-10-31T00:00:00Z'));
  assert.equal(record.savedAt, '2026-10-31T00:00:00.000Z');
  const { states } = loadRecord(roundTrip(record));
  assert.equal(states.length, actions.length + 1);
  assert.deepEqual(states.at(-1), actions.reduce(applyAction, createGame()));
});

test('기보: 확장 규칙 설정도 그대로 복원한다', () => {
  const config = createGame(variantConfig({ size: 7, players: 4, fog: true })).config;
  const moves = [step(3, 1), step(1, 3), step(3, 5), step(5, 3)];
  const { record, states } = loadRecord(roundTrip(createRecord(config, moves)));
  assert.deepEqual(record.config, config);
  assert.equal(states.at(-1)!.players.length, 4);
  assert.equal(states.at(-1)!.config.fogDuration, 8);
});

test('기보: 안개 모드에서 부딪힌 수도 똑같이 재현한다', () => {
  const config = createGame(variantConfig({ ...BASIC_VARIANT, fog: true })).config;
  const moves: Action[] = [{ type: 'wall', kind: 'normal', orientation: 'h', x: 4, y: 7 }, step(4, 7)];
  const last = loadRecord(roundTrip(createRecord(config, moves))).states.at(-1)!;
  assert.deepEqual(last.lastBump, [1]);
  assert.deepEqual(last.players[1].pos, { x: 4, y: 8 });
});

test('기보: 승자를 기록한다', () => {
  // A는 e열로 곧장 올라가고, B는 d열로 비켜서 내려온다. A가 먼저 도착한다.
  const race: Action[] = [];
  for (let i = 1; i <= 8; i++) {
    race.push(step(4, i));
    if (i < 8) race.push(step(3, 9 - i));
  }
  const record = createRecord(createGame().config, race);
  assert.equal(record.winner, 0);
  assert.equal(replay(record.config, race).at(-1)!.winner, 0);
});

test('기보: 형식이 틀린 파일은 이유와 함께 거부한다', () => {
  const record = roundTrip(createRecord(createGame().config, actions)) as Record<string, unknown>;
  assert.throws(() => loadRecord({ hello: 1 }), /simPle 기보 파일이 아닙니다/);
  assert.throws(() => loadRecord({ ...record, version: 99 }), /지원하지 않는 기보 버전/);
  assert.throws(() => loadRecord({ ...record, config: { ...(record.config as object), size: 8 } }), /보드 크기/);
  assert.throws(() => loadRecord({ ...record, actions: [{ type: 'jump' }] }), /1번째 수의 형식/);
});

test('기보: 규칙상 둘 수 없는 수가 있으면 몇 번째 수인지 알려 준다', () => {
  const record = roundTrip(createRecord(createGame().config, actions)) as Record<string, unknown>;
  const broken = [...actions.slice(0, 3), step(0, 0)];
  assert.throws(() => loadRecord({ ...record, actions: broken }), /4번째 수를 둘 수 없습니다: 이동할 수 없는 칸입니다/);
});
