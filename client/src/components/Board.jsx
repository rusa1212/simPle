import {
  CELL,
  LABEL,
  boardPixels,
  cellCenter,
  cellOrigin,
  columnLabel,
  rowLabel,
  wallRect,
} from './boardGeometry'

const PLAYER_NAMES = ['A', 'B']

function Board({ game, moves = [], onMove }) {
  const { size } = game.config
  const pixels = boardPixels(size)
  const indices = [...Array(size).keys()]

  // 각 칸이 어느 플레이어의 목표 줄인지
  const goalOwner = (x, y) =>
    game.players.findIndex((p) => (p.goal.axis === 'x' ? x : y) === p.goal.value)

  return (
    <svg
      className="board"
      viewBox={`${-LABEL} 0 ${pixels + LABEL} ${pixels + LABEL}`}
      role="img"
      aria-label={`${size}×${size} 게임 보드`}
    >
      <g className="cells">
        {indices.map((y) =>
          indices.map((x) => {
            const { left, top } = cellOrigin(size, x, y)
            const owner = goalOwner(x, y)
            return (
              <rect
                key={`${x},${y}`}
                className={owner >= 0 ? `cell goal-p${owner}` : 'cell'}
                x={left}
                y={top}
                width={CELL}
                height={CELL}
                rx={6}
              />
            )
          }),
        )}
      </g>

      <g className="labels">
        {indices.map((x) => (
          <text key={`c${x}`} x={cellCenter(size, x, 0).cx} y={pixels + LABEL / 2 + 2}>
            {columnLabel(x)}
          </text>
        ))}
        {indices.map((y) => (
          <text key={`r${y}`} x={-LABEL / 2} y={cellCenter(size, 0, y).cy}>
            {rowLabel(y)}
          </text>
        ))}
      </g>

      <g className="walls">
        {game.walls.map((wall) => (
          <rect
            key={wall.id}
            className={`wall wall-p${wall.owner} wall-${wall.kind}`}
            {...wallRect(size, wall)}
            rx={3}
          />
        ))}
      </g>

      <g className="pawns">
        {game.players.map((player, i) => {
          const { cx, cy } = cellCenter(size, player.pos.x, player.pos.y)
          const active = i === game.current && game.winner === null
          return (
            <g key={i} className={`pawn pawn-p${i}${active ? ' active' : ''}`}>
              {active && <circle className="pawn-ring" cx={cx} cy={cy} r={CELL * 0.44} />}
              <circle cx={cx} cy={cy} r={CELL * 0.34} />
              <text x={cx} y={cy}>
                {PLAYER_NAMES[i]}
              </text>
            </g>
          )
        })}
      </g>

      <g className={`move-targets move-p${game.current}`}>
        {moves.map((pos) => {
          const { left, top } = cellOrigin(size, pos.x, pos.y)
          const { cx, cy } = cellCenter(size, pos.x, pos.y)
          const name = `${columnLabel(pos.x)}${rowLabel(pos.y)}`
          return (
            <g
              key={name}
              className="move-target"
              role="button"
              tabIndex={0}
              aria-label={`${name}(으)로 이동`}
              onClick={() => onMove?.(pos)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onMove?.(pos)
                }
              }}
            >
              <rect x={left} y={top} width={CELL} height={CELL} rx={6} />
              <circle cx={cx} cy={cy} r={CELL * 0.14} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default Board
