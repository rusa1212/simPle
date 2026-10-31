import type { GameConfig, Inventory } from './types.ts';
import { DEFAULT_CONFIG } from './config.ts';

// 기본 규칙(config.ts) 위에 얹는 확장 규칙. 확장 규칙을 하나도 켜지 않으면 기본 게임과 같다.

export type BoardSize = 7 | 9 | 11;

/** 확장 규칙 선택값 */
export interface Variant {
  size: BoardSize;
  players: 2 | 4;
  /** 안개 모드: 상대가 새로 놓은 막대가 FOG_DURATION수 동안 보이지 않는다 */
  fog: boolean;
}

export const BASIC_VARIANT: Variant = { size: 9, players: 2, fog: false };

/** 안개 모드: 새 막대가 상대의 다음 몇 차례 동안 보이지 않는지 */
export const FOG_ROUNDS = 2;

/** 보드 크기별 막대 개수와 임시 막대 유지 시간. 9×9는 기본 규칙 그대로다. */
export const BOARD_PRESETS: Record<BoardSize, { inventory: Inventory; tempWallDuration: number }> = {
  7: { inventory: { normal: 4, long: 1, temp: 2, remover: 1 }, tempWallDuration: 6 },
  9: { inventory: DEFAULT_CONFIG.inventory, tempWallDuration: DEFAULT_CONFIG.tempWallDuration },
  11: { inventory: { normal: 8, long: 3, temp: 3, remover: 1 }, tempWallDuration: 8 },
};

/** 4인 모드의 1인당 개수. 막대가 너무 많으면 길이 금방 막히므로 2인보다 적게 준다. */
export const FOUR_PLAYER_INVENTORY: Record<BoardSize, Inventory> = {
  7: { normal: 2, long: 1, temp: 1, remover: 1 },
  9: { normal: 3, long: 1, temp: 1, remover: 1 },
  11: { normal: 4, long: 2, temp: 1, remover: 1 },
};

/**
 * createGame에 넘길 설정.
 * 임시 막대와 안개 시간은 수(모든 플레이어 합산) 단위라서, 인원이 늘면 각자의 차례 기준으로 같아지도록 늘린다.
 */
export function variantConfig(variant: Variant): Partial<GameConfig> {
  const preset = BOARD_PRESETS[variant.size];
  return {
    size: variant.size,
    playerCount: variant.players,
    inventory: { ...(variant.players === 4 ? FOUR_PLAYER_INVENTORY[variant.size] : preset.inventory) },
    tempWallDuration: (preset.tempWallDuration * variant.players) / 2,
    fogDuration: variant.fog ? FOG_ROUNDS * variant.players : 0,
  };
}
