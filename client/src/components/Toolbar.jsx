import { WALL_LENGTH } from '@game'

const WALL_TOOLS = [
  { kind: 'normal', name: '일반 막대' },
  { kind: 'long', name: '긴 막대' },
  { kind: 'temp', name: '임시 막대' },
]

/**
 * tool: 'move', 막대 종류, 'remover' 중 하나. inventory: 현재 플레이어의 남은 개수.
 * canRemove: 철거할 상대 막대가 있는지.
 */
function Toolbar({
  tool,
  onToolChange,
  orientation,
  onOrientationChange,
  inventory,
  canRemove,
  player,
  disabled,
}) {
  return (
    <div className={`toolbar toolbar-p${player}`} role="toolbar" aria-label="행동 선택">
      <button
        type="button"
        aria-pressed={tool === 'move'}
        onClick={() => onToolChange('move')}
        disabled={disabled}
      >
        말 이동
      </button>
      {WALL_TOOLS.map(({ kind, name }) => (
        <button
          key={kind}
          type="button"
          aria-pressed={tool === kind}
          onClick={() => onToolChange(kind)}
          disabled={disabled || inventory[kind] <= 0}
        >
          {name}
          <span className="tool-meta">
            {WALL_LENGTH[kind]}칸 · {inventory[kind]}개
          </span>
        </button>
      ))}
      <button
        type="button"
        aria-pressed={tool === 'remover'}
        onClick={() => onToolChange('remover')}
        disabled={disabled || inventory.remover <= 0 || !canRemove}
      >
        철거 도구
        <span className="tool-meta">상대 막대 · {inventory.remover}개</span>
      </button>
      <button
        type="button"
        className="orientation"
        onClick={() => onOrientationChange(orientation === 'h' ? 'v' : 'h')}
        disabled={disabled}
        title="R 키로도 바꿀 수 있습니다"
      >
        <span className="orientation-label">
          방향: {orientation === 'h' ? '가로' : '세로'}
          <span className={`orientation-icon ${orientation}`} aria-hidden="true" />
        </span>
        <span className="tool-meta">R</span>
      </button>
    </div>
  )
}

export default Toolbar
