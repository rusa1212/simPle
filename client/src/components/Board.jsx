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

const PLAYER_NAMES = ['A', 'B', 'C', 'D']

/**
 * wallTool이 있으면 막대 설치 모드: 마우스 위치에 미리보기를 띄우고 클릭하면 onPlaceWall을 부른다.
 * removing이면 철거 모드: 상대 막대를 클릭하면 onRemoveWall을 부른다.
 * 둘 다 아니면 이동 모드: moves 칸을 표시하고 클릭하면 onMove를 부른다.
 */
function Board({
  game,
  moves = [],
  onMove,
  wallTool,
  onPlaceWall,
  onPreviewChange,
  removing,
  onRemoveWall,
}) {
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

      <g className={`walls${removing ? ' removing' : ''}`}>
        {game.walls.map((wall) => {
          const rect = wallRect(size, wall)
          const removable = removing && wall.owner !== game.current
          const remaining = wall.expiresAt === null ? null : wall.expiresAt - game.turn
          // 안개 모드에서 아직 상대에게 보이지 않는 내 막대
          const fogged = wall.hiddenUntil !== null && wall.hiddenUntil > game.turn
          const bumped = game.lastBump?.includes(wall.id)
          const remove = () => onRemoveWall?.(wall.id)
          return (
            <g
              key={wall.id}
              className={`wall wall-p${wall.owner} wall-${wall.kind}${removable ? ' removable' : ''}${fogged ? ' fogged' : ''}${bumped ? ' bumped' : ''}`}
              {...(removable && {
                role: 'button',
                tabIndex: 0,
                'aria-label': `${PLAYER_NAMES[wall.owner]}의 막대 철거`,
                onClick: remove,
                onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    remove()
                  }
                },
              })}
            >
              {removable && (
                // 막대가 얇아서 클릭하기 쉽도록 넓은 투명 영역을 깐다
                <rect
                  className="wall-hit"
                  x={rect.x - 6}
                  y={rect.y - 6}
                  width={rect.width + 12}
                  height={rect.height + 12}
                />
              )}
              <rect className="wall-body" {...rect} rx={3}>
                {fogged && <title>{`상대에게 ${wall.hiddenUntil - game.turn}수 동안 보이지 않음`}</title>}
              </rect>
              {remaining !== null && (
                <g className="wall-timer">
                  <title>{`${remaining}수 뒤 사라짐`}</title>
                  <circle cx={rect.x + rect.width / 2} cy={rect.y + rect.height / 2} r={9} />
                  <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2}>
                    {remaining}
                  </text>
                </g>
              )}
            </g>
          )
        })}
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
