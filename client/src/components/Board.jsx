import { useEffect, useRef, useState } from 'react'
import { WALL_LENGTH, validateAction } from '@game'
import {
  CELL,
  LABEL,
  boardPixels,
  cellCenter,
  cellOrigin,
  columnLabel,
  rowLabel,
  wallAtPoint,
  wallRect,
} from './boardGeometry'

const PLAYER_NAMES = ['A', 'B']

/**
 * wallTool이 있으면 막대 설치 모드: 마우스 위치에 미리보기를 띄우고 클릭하면 onPlaceWall을 부른다.
 * 없으면 이동 모드: moves 칸을 표시하고 클릭하면 onMove를 부른다.
 */
function Board({ game, moves = [], onMove, wallTool, onPlaceWall, onPreviewChange }) {
  const { size } = game.config
  const pixels = boardPixels(size)
  const indices = [...Array(size).keys()]
  const svgRef = useRef(null)
  const [pointer, setPointer] = useState(null)

  // 각 칸이 어느 플레이어의 목표 줄인지
  const goalOwner = (x, y) =>
    game.players.findIndex((p) => (p.goal.axis === 'x' ? x : y) === p.goal.value)

  /** SVG 좌표의 점에 놓일 막대 설치 수. 보드 밖이면 null. */
  const wallActionAt = (point) => {
    if (!wallTool || !point) return null
    const length = WALL_LENGTH[wallTool.kind]
    const shape = wallAtPoint(size, point.x, point.y, wallTool.orientation, length)
    if (!shape) return null
    return { type: 'wall', kind: wallTool.kind, orientation: shape.orientation, x: shape.x, y: shape.y }
  }

  const previewAction = wallActionAt(pointer)
  const previewError = previewAction ? validateAction(game, previewAction) : null

  useEffect(() => {
    onPreviewChange?.(previewError)
  }, [previewError, onPreviewChange])

  const toSvgPoint = (e) => {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svgRef.current.getScreenCTM().inverse(),
    )
    return { x: pt.x, y: pt.y }
  }

  const wallHandlers = wallTool
    ? {
        onPointerMove: (e) => setPointer(toSvgPoint(e)),
        onPointerLeave: () => setPointer(null),
        onClick: (e) => {
          const point = toSvgPoint(e)
          const action = wallActionAt(point)
          if (action && validateAction(game, action) === null) {
            setPointer(null)
            onPlaceWall?.(action)
          } else {
            setPointer(point)
          }
        },
      }
    : {}

  return (
    <svg
      ref={svgRef}
      className={`board${wallTool ? ' placing' : ''}`}
      viewBox={`${-LABEL} 0 ${pixels + LABEL} ${pixels + LABEL}`}
      role="img"
      aria-label={`${size}×${size} 게임 보드`}
      {...wallHandlers}
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

      {previewAction && (
        <rect
          className={`wall-preview wall-preview-p${game.current} ${previewError ? 'invalid' : 'valid'}`}
          {...wallRect(size, { ...previewAction, length: WALL_LENGTH[previewAction.kind] })}
          rx={3}
        />
      )}

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
