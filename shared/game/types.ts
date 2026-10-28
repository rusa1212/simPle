export interface Pos {
  x: number;
  y: number;
}

/** h: 가로 막대(위아래 이동을 막음), v: 세로 막대(좌우 이동을 막음) */
export type Orientation = 'h' | 'v';

export type WallKind = 'normal' | 'long' | 'temp';

export interface Wall {
  id: number;
  kind: WallKind;
  orientation: Orientation;
  /** 가로 막대: (x, y)~(x+length-1, y) 칸의 위쪽 홈. 세로 막대: (x, y)~(x, y+length-1) 칸의 오른쪽 홈. */
  x: number;
  y: number;
  length: number;
  owner: number;
  /** 임시 막대가 사라지는 turn. 영구 막대는 null. */
  expiresAt: number | null;
}

export interface Inventory {
  normal: number;
  long: number;
  temp: number;
  remover: number;
}

/** 목표 줄. 4인 모드를 위해 x축 목표도 허용한다. */
export interface Goal {
  axis: 'x' | 'y';
  value: number;
}

export interface Player {
  pos: Pos;
  goal: Goal;
  inventory: Inventory;
}

export interface GameConfig {
  size: number;
  inventory: Inventory;
  /** 임시 막대가 유지되는 수(양쪽 플레이어 합산) */
  tempWallDuration: number;
}

export interface GameState {
  config: GameConfig;
  players: Player[];
  walls: Wall[];
  current: number;
  /** 지금까지 둔 수의 개수 */
  turn: number;
  winner: number | null;
  nextWallId: number;
}

export type Action =
  | { type: 'move'; to: Pos }
  | { type: 'wall'; kind: WallKind; orientation: Orientation; x: number; y: number }
  | { type: 'remove'; wallId: number };
