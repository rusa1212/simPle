import type { GameConfig, WallKind } from './types.ts';

export const WALL_LENGTH: Record<WallKind, number> = {
  normal: 2,
  long: 3,
  temp: 2,
};

export const DEFAULT_CONFIG: GameConfig = {
  size: 9,
  playerCount: 2,
  inventory: { normal: 6, long: 2, temp: 2, remover: 1 },
  tempWallDuration: 6,
  fogDuration: 0,
};
