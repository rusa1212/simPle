import type { Action, GameConfig, GameState, Orientation, Player, WallKind } from './types.ts';
import { DEFAULT_CONFIG, WALL_LENGTH } from './config.ts';
import { getPawnMoves } from './moves.ts';
import { isAtGoal, shortestPathLength } from './path.ts';
import { buildBlockedEdges, isWallInBounds, wallsConflict } from './walls.ts';

export function createGame(config: Partial<GameConfig> = {}): GameState {
  const cfg: GameConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    inventory: { ...DEFAULT_CONFIG.inventory, ...config.inventory },
  };
  const mid = Math.floor(cfg.size / 2);
  const last = cfg.size - 1;
  const players: Player[] = [
    { pos: { x: mid, y: 0 }, goal: { axis: 'y', value: last }, inventory: { ...cfg.inventory } },
    { pos: { x: mid, y: last }, goal: { axis: 'y', value: 0 }, inventory: { ...cfg.inventory } },
  ];
  return { config: cfg, players, walls: [], current: 0, turn: 0, winner: null, nextWallId: 1 };
}

/** 각 플레이어의 목표 줄까지 최단 거리 (막대만 고려) */
export function getPathLengths(state: GameState): (number | null)[] {
  const blocked = buildBlockedEdges(state.walls);
  return state.players.map((p) => shortestPathLength(state.config.size, blocked, p.pos, p.goal));
}

function validateWall(
  state: GameState,
  kind: WallKind,
  orientation: Orientation,
  x: number,
  y: number,
): string | null {
  const player = state.players[state.current];
  if (player.inventory[kind] <= 0) return '남은 막대가 없습니다';
  const shape = { orientation, x, y, length: WALL_LENGTH[kind] };
  if (!isWallInBounds(state.config.size, shape)) return '보드 밖입니다';
  if (state.walls.some((w) => wallsConflict(w, shape))) return '다른 막대와 겹칩니다';
  const blocked = buildBlockedEdges([...state.walls, shape]);
  const sealed = state.players.some(
    (p) => shortestPathLength(state.config.size, blocked, p.pos, p.goal) === null,
  );
  if (sealed) return '목표 줄로 가는 길을 완전히 막을 수 없습니다';
  return null;
}

/** 둘 수 있는 수면 null, 아니면 이유를 돌려준다. */
export function validateAction(state: GameState, action: Action): string | null {
  if (state.winner !== null) return '게임이 끝났습니다';
  switch (action.type) {
    case 'move': {
      const ok = getPawnMoves(state, state.current).some(
        (p) => p.x === action.to.x && p.y === action.to.y,
      );
      return ok ? null : '이동할 수 없는 칸입니다';
    }
    case 'wall':
      return validateWall(state, action.kind, action.orientation, action.x, action.y);
    case 'remove': {
      if (state.players[state.current].inventory.remover <= 0) return '철거 도구가 없습니다';
      const target = state.walls.find((w) => w.id === action.wallId);
      if (!target) return '없는 막대입니다';
      if (target.owner === state.current) return '상대 막대만 철거할 수 있습니다';
      return null;
    }
  }
}

/** 수를 적용한 새 상태를 돌려준다. 원래 상태는 바꾸지 않는다. */
export function applyAction(state: GameState, action: Action): GameState {
  const reason = validateAction(state, action);
  if (reason) throw new Error(reason);

  const me = state.current;
  const players = state.players.map((p) => ({ ...p, inventory: { ...p.inventory } }));
  let walls = state.walls;
  let nextWallId = state.nextWallId;

  switch (action.type) {
    case 'move':
      players[me].pos = { ...action.to };
      break;
    case 'wall':
      players[me].inventory[action.kind]--;
      walls = [
        ...walls,
        {
          id: nextWallId++,
          kind: action.kind,
          orientation: action.orientation,
          x: action.x,
          y: action.y,
          length: WALL_LENGTH[action.kind],
          owner: me,
          expiresAt: action.kind === 'temp' ? state.turn + state.config.tempWallDuration : null,
        },
      ];
      break;
    case 'remove':
      players[me].inventory.remover--;
      walls = walls.filter((w) => w.id !== action.wallId);
      break;
  }

  const turn = state.turn + 1;
  walls = walls.filter((w) => w.expiresAt === null || w.expiresAt > turn);
  const winner = isAtGoal(players[me].pos, players[me].goal) ? me : null;

  return {
    ...state,
    players,
    walls,
    turn,
    winner,
    nextWallId,
    current: winner === null ? (me + 1) % players.length : me,
  };
}
