export * from './types.ts';
export * from './config.ts';
export * from './game.ts';
export * from './variants.ts';
export { getPawnMoves } from './moves.ts';
export { chooseAction, evaluate, getCandidateActions, getLegalActions, WIN_SCORE } from './ai.ts';
export { isAtGoal, shortestPath, shortestPathLength } from './path.ts';
export { buildBlockedEdges, isWallInBounds, wallsConflict } from './walls.ts';
