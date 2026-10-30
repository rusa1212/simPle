export * from './types.ts';
export * from './config.ts';
export * from './game.ts';
export { getPawnMoves } from './moves.ts';
export { evaluate, WIN_SCORE } from './ai.ts';
export { isAtGoal, shortestPathLength } from './path.ts';
export { buildBlockedEdges, isWallInBounds, wallsConflict } from './walls.ts';
