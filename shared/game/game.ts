import type { Action, GameConfig, GameState, Orientation, Player, Wall, WallKind } from './types.ts';
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
  // 각자 한 변의 가운데에서 출발해 반대편 변으로 간다. 차례는 A → B → C → D 순서다.
  const starts: Omit<Player, 'inventory'>[] = [
    { pos: { x: mid, y: 0 }, goal: { axis: 'y', value: last } },
    { pos: { x: mid, y: last }, goal: { axis: 'y', value: 0 } },
    { pos: { x: 0, y: mid }, goal: { axis: 'x', value: last } },
    { pos: { x: last, y: mid }, goal: { axis: 'x', value: 0 } },
  ];
  const players: Player[] = starts
    .slice(0, cfg.playerCount)
    .map((p) => ({ ...p, inventory: { ...cfg.inventory } }));
  return { config: cfg, players, walls: [], current: 0, turn: 0, winner: null, nextWallId: 1, lastBump: null };
}

/** 안개 모드에서 player가 아직 볼 수 없는 막대인지 */
export function isHiddenFrom(wall: Wall, player: number, turn: number): boolean {
  return wall.owner !== player && wall.hiddenUntil !== null && turn < wall.hiddenUntil;
}

/** player에게 보이는 막대만 남긴 상태. 숨은 막대가 없으면 원래 상태를 그대로 돌려준다. */
export function viewFor(state: GameState, player: number): GameState {
  if (!state.walls.some((w) => isHiddenFrom(w, player, state.turn))) return state;
  return { ...state, walls: state.walls.filter((w) => !isHiddenFrom(w, player, state.turn)) };
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

/** 모든 막대를 아는 상태에서 실제로 둘 수 있는 수인지 */
function checkAction(state: GameState, action: Action): string | null {
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

/**
 * 둘 수 있는 수면 null, 아니면 이유를 돌려준다.
 * 현재 플레이어에게 보이는 막대만으로 판단하므로, 안개 모드에서는 보이지 않는 막대에 막히는 수도 허용된다.
 */
export function validateAction(state: GameState, action: Action): string | null {
  return checkAction(viewFor(state, state.current), action);
}

/** 보이지 않는 막대에 막힌 수에서 드러낼 막대. 하나만 더해도 막히는 막대를 고르고, 없으면 숨은 막대 전부. */
function findBlockers(state: GameState, action: Action): Wall[] {
  const view = viewFor(state, state.current);
  const hidden = state.walls.filter((w) => !view.walls.includes(w));
  const blockers = hidden.filter((w) => checkAction({ ...view, walls: [...view.walls, w] }, action) !== null);
  return blockers.length > 0 ? blockers : hidden;
}

/** 보이지 않는 막대에 막힌 수: 막은 막대가 드러나고, 아무것도 소모하지 않은 채 차례가 넘어간다. */
function applyBump(state: GameState, action: Action): GameState {
  const ids = findBlockers(state, action).map((w) => w.id);
  const turn = state.turn + 1;
  const walls = state.walls
    .map((w) => (ids.includes(w.id) ? { ...w, hiddenUntil: null } : w))
    .filter((w) => w.expiresAt === null || w.expiresAt > turn);
  return {
    ...state,
    walls,
    turn,
    current: (state.current + 1) % state.players.length,
    lastBump: ids,
  };
}

/** 수를 적용한 새 상태를 돌려준다. 원래 상태는 바꾸지 않는다. */
export function applyAction(state: GameState, action: Action): GameState {
  const reason = validateAction(state, action);
  if (reason) throw new Error(reason);
  if (checkAction(state, action) !== null) return applyBump(state, action);

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
          hiddenUntil: state.config.fogDuration > 0 ? state.turn + state.config.fogDuration : null,
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
    lastBump: null,
    current: winner === null ? (me + 1) % players.length : me,
  };
}
