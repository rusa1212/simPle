import type { Action, GameConfig, GameState } from './types.ts';
import { applyAction, createGame } from './game.ts';

// 기보: 게임 설정과 둔 수 목록. 처음부터 수를 다시 두면 같은 상태가 나온다.

export const RECORD_FORMAT = 'simple-record';
export const RECORD_VERSION = 1;

export interface GameRecord {
  format: typeof RECORD_FORMAT;
  version: number;
  config: GameConfig;
  actions: Action[];
  /** 저장한 시점의 승자. 읽을 때는 다시 계산하므로 참고용이다. */
  winner: number | null;
  savedAt: string;
}

export function createRecord(config: GameConfig, actions: Action[], savedAt = new Date()): GameRecord {
  const states = replay(config, actions);
  return {
    format: RECORD_FORMAT,
    version: RECORD_VERSION,
    config,
    actions,
    winner: states.at(-1)!.winner,
    savedAt: savedAt.toISOString(),
  };
}

/** 설정과 수 목록으로 처음 상태부터 각 수를 둔 뒤의 상태까지 모두 돌려준다. 둘 수 없는 수가 있으면 예외를 던진다. */
export function replay(config: GameConfig, actions: Action[]): GameState[] {
  const states = [createGame(config)];
  actions.forEach((action, i) => {
    try {
      states.push(applyAction(states.at(-1)!, action));
    } catch (e) {
      throw new Error(`${i + 1}번째 수를 둘 수 없습니다: ${(e as Error).message}`);
    }
  });
  return states;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isInt = (v: unknown): v is number => Number.isInteger(v);

function checkConfig(c: unknown): string | null {
  if (!isObject(c)) return '설정이 없습니다';
  if (!isInt(c.size) || c.size < 3 || c.size % 2 === 0) return '보드 크기가 올바르지 않습니다';
  if (c.playerCount !== 2 && c.playerCount !== 4) return '인원이 올바르지 않습니다';
  const inv = c.inventory;
  if (!isObject(inv) || !['normal', 'long', 'temp', 'remover'].every((k) => isInt(inv[k]) && inv[k] >= 0)) {
    return '막대 개수가 올바르지 않습니다';
  }
  if (!isInt(c.tempWallDuration) || c.tempWallDuration < 1) return '임시 막대 유지 시간이 올바르지 않습니다';
  if (!isInt(c.fogDuration) || c.fogDuration < 0) return '안개 시간이 올바르지 않습니다';
  return null;
}

function checkAction(a: unknown): boolean {
  if (!isObject(a)) return false;
  switch (a.type) {
    case 'move':
      return isObject(a.to) && isInt(a.to.x) && isInt(a.to.y);
    case 'wall':
      return (
        ['normal', 'long', 'temp'].includes(a.kind as string) &&
        (a.orientation === 'h' || a.orientation === 'v') &&
        isInt(a.x) &&
        isInt(a.y)
      );
    case 'remove':
      return isInt(a.wallId);
    default:
      return false;
  }
}

/**
 * JSON에서 읽은 값을 기보로 검사하고, 각 수를 둔 뒤의 상태들과 함께 돌려준다.
 * 형식이 틀리거나 규칙상 둘 수 없는 수가 있으면 이유를 담은 예외를 던진다.
 */
export function loadRecord(data: unknown): { record: GameRecord; states: GameState[] } {
  if (!isObject(data) || data.format !== RECORD_FORMAT) throw new Error('simPle 기보 파일이 아닙니다');
  if (data.version !== RECORD_VERSION) throw new Error(`지원하지 않는 기보 버전입니다: ${String(data.version)}`);
  const configError = checkConfig(data.config);
  if (configError) throw new Error(configError);
  if (!Array.isArray(data.actions)) throw new Error('수 목록이 없습니다');
  const bad = data.actions.findIndex((a) => !checkAction(a));
  if (bad >= 0) throw new Error(`${bad + 1}번째 수의 형식이 올바르지 않습니다`);

  const record = data as unknown as GameRecord;
  return { record, states: replay(record.config, record.actions) };
}
