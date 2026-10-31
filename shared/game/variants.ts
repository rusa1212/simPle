import type { GameConfig, Inventory } from './types.ts';
import { DEFAULT_CONFIG } from './config.ts';

// 기본 규칙(config.ts) 위에 얹는 확장 규칙. 확장 규칙을 하나도 켜지 않으면 기본 게임과 같다.

export type BoardSize = 7 | 9 | 11;

/** 확장 규칙 선택값 */
export interface Variant {
  size: BoardSize;
  /** 안개 모드: 상대가 새로 놓은 막대가 FOG_DURATION수 동안 보이지 않는다 */
  fog: boolean;
}

export const BASIC_VARIANT: Variant = { size: 9, fog: false };

export const FOG_DURATION = 4;

/** 보드 크기별 막대 개수와 임시 막대 유지 시간. 9×9는 기본 규칙 그대로다. */
export const BOARD_PRESETS: Record<BoardSize, { inventory: Inventory; tempWallDuration: number }> = {
  7: { inventory: { normal: 4, long: 1, temp: 2, remover: 1 }, tempWallDuration: 6 },
  9: { inventory: DEFAULT_CONFIG.inventory, tempWallDuration: DEFAULT_CONFIG.tempWallDuration },
  11: { inventory: { normal: 8, long: 3, temp: 3, remover: 1 }, tempWallDuration: 8 },
};

/** createGame에 넘길 설정 */
export function variantConfig(variant: Variant): Partial<GameConfig> {
  const preset = BOARD_PRESETS[variant.size];
  return {
    size: variant.size,
    inventory: { ...preset.inventory },
    tempWallDuration: preset.tempWallDuration,
    fogDuration: variant.fog ? FOG_DURATION : 0,
  };
}
