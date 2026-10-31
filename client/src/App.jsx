import { useEffect, useEffectEvent, useState } from 'react'
import { BASIC_VARIANT, FOG_ROUNDS, applyAction, createGame, getPawnMoves, previousPlayer, variantConfig, viewFor } from '@game'
import Board from './components/Board'
import PlayerPanel from './components/PlayerPanel'
import Toolbar from './components/Toolbar'
import './App.css'

const PLAYER_NAMES = ['A', 'B', 'C', 'D']
const WALL_KINDS = ['normal', 'long', 'temp']
// AI 상대가 있으면 사람은 A를, AI는 나머지를 모두 맡는다
const HUMAN_PLAYER = 0
const OPPONENTS = ['사람', 'AI (보통)', 'AI (어려움)']
// 난이도별 탐색 깊이. 4인은 후보 수가 많아서 한 단계씩 얕게 본다.
const AI_DEPTHS = { 2: [0, 2, 3], 4: [0, 1, 2] }
const PLAYER_COUNTS = [
  { players: 2, name: '2인' },
  { players: 4, name: '4인' },
]
const BOARD_SIZES = [
  { size: 7, name: '7×7 빠른 대전' },
  { size: 9, name: '9×9 기본' },
  { size: 11, name: '11×11 장기전' },
]

function App() {
  // 지금까지의 모든 상태. 마지막이 현재 상태이고, 무르기는 마지막을 빼는 것이다.
  const [history, setHistory] = useState(() => [createGame()])
  // 확장 규칙. 바꾸면 새 게임을 시작한다.
  const [variant, setVariant] = useState(BASIC_VARIANT)
  const [tool, setTool] = useState('move')
  const [orientation, setOrientation] = useState('h')
  const [previewError, setPreviewError] = useState(null)
  const [showPaths, setShowPaths] = useState(false)
  // OPPONENTS의 번호. 0이면 사람끼리 둔다.
  const [aiLevel, setAiLevel] = useState(0)

  const game = history.at(-1)
  const canUndo = history.length > 1
  const over = game.winner !== null
  const playerCount = game.players.length
  const aiDepth = AI_DEPTHS[playerCount][aiLevel]
  const isAiTurn = (s) => aiLevel > 0 && s.winner === null && s.current !== HUMAN_PLAYER
  const thinking = isAiTurn(game)
  // AI가 생각하는 동안은 사람이 둘 수 없다
  const locked = over || thinking
  // 안개 모드에서 화면에 보여 줄 시점. AI 상대면 늘 사람 쪽, 사람끼리면 지금 둘 차례인 쪽. 게임이 끝나면 전부 공개한다.
  const viewer = aiLevel > 0 ? HUMAN_PLAYER : game.current
  const view = over ? game : viewFor(game, viewer)
  const placing = WALL_KINDS.includes(tool) && !locked
  const removing = tool === 'remover' && !locked
  const moves = !locked && tool === 'move' ? getPawnMoves(view, game.current) : []
  const canRemove = view.walls.some((w) => w.owner !== game.current)

  let hint = null
  if (placing && previewError) hint = { text: previewError, error: true }
  else if (removing) hint = { text: '철거할 상대 막대를 클릭하세요 (Esc: 취소)', error: false }
  else if (game.lastBump) {
    const bumped = PLAYER_NAMES[previousPlayer(game)]
    hint = { text: `${bumped}가 보이지 않는 막대에 막혀 차례를 넘겼습니다`, error: false }
  }

  const play = (action) => {
    setHistory((h) => [...h, applyAction(h.at(-1), action)])
    setTool('move')
  }
  // AI 상대일 때는 AI의 수까지 함께 물러서 사람 차례로 돌아간다
  const undo = () => {
    setHistory((h) => {
      let n = h.length - 1
      while (n > 1 && isAiTurn(h[n - 1])) n--
      return n > 0 ? h.slice(0, n) : h
    })
    setTool('move')
  }
  // 새 게임도 기록에 쌓아서, 실수로 눌렀을 때 무르기로 되돌릴 수 있게 한다
  const newGame = (v = variant) => {
    setHistory((h) => [...h, createGame(variantConfig(v))])
    setTool('move')
  }
  const changeVariant = (v) => {
    setVariant(v)
    newGame(v)
  }

  // AI 차례가 되면 Worker에서 수를 계산해 둔다. 그 사이 무르기나 새 게임으로 상태가 바뀌면 계산을 버린다.
  useEffect(() => {
    if (!thinking) return
    const worker = new Worker(new URL('./ai.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      if (e.data) play(e.data)
      worker.terminate()
    }
    // AI도 자기에게 보이는 막대만 알고 수를 고른다
    worker.postMessage({ state: viewFor(game, game.current), depth: aiDepth })
    return () => worker.terminate()
  }, [game, thinking, aiDepth])

  // 상대 설정에 따라 무르기 동작이 달라지므로 항상 최신 undo를 부르도록 Effect Event로 둔다
  const onKeyDown = useEffectEvent((e) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      undo()
      return
    }
    if (e.key === 'r' || e.key === 'R') setOrientation((o) => (o === 'h' ? 'v' : 'h'))
    if (e.key === 'Escape') setTool('move')
  })

  useEffect(() => {
    const listener = (e) => onKeyDown(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  return (
    <main className="app">
      <header className="app-header">
        <h1>simPle</h1>
        <div className="game-actions">
          <label className="opponent">
            {PLAYER_NAMES.slice(1, playerCount).join('·')} 플레이어
            <select value={aiLevel} onChange={(e) => setAiLevel(Number(e.target.value))}>
              {OPPONENTS.map((name, level) => (
                <option key={level} value={level}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showPaths}
              onChange={(e) => setShowPaths(e.target.checked)}
            />
            최단 경로 표시
          </label>
          <button type="button" onClick={undo} disabled={!canUndo} title="Ctrl+Z">
            무르기
          </button>
          <button type="button" onClick={() => newGame()}>
            새 게임
          </button>
        </div>
      </header>
      <fieldset className="variant">
        <legend>확장 규칙</legend>
        <label>
          인원
          <select
            value={variant.players}
            onChange={(e) => changeVariant({ ...variant, players: Number(e.target.value) })}
          >
            {PLAYER_COUNTS.map(({ players, name }) => (
              <option key={players} value={players}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          보드 크기
          <select
            value={variant.size}
            onChange={(e) => changeVariant({ ...variant, size: Number(e.target.value) })}
          >
            {BOARD_SIZES.map(({ size, name }) => (
              <option key={size} value={size}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle" title={`새로 놓인 막대는 다른 플레이어의 다음 ${FOG_ROUNDS}차례 동안 보이지 않습니다`}>
          <input
            type="checkbox"
            checked={variant.fog}
            onChange={(e) => changeVariant({ ...variant, fog: e.target.checked })}
          />
          안개 모드
        </label>
      </fieldset>
      <p className={`status status-p${game.winner ?? game.current}`}>
        {over
          ? `${PLAYER_NAMES[game.winner]} 승리!`
          : thinking
            ? `${PLAYER_NAMES[game.current]} (AI) 생각하는 중…`
            : `${PLAYER_NAMES[game.current]} 차례`}
      </p>
      <PlayerPanel game={view} showPaths={showPaths} isAi={(i) => aiLevel > 0 && i !== HUMAN_PLAYER} />
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        orientation={orientation}
        onOrientationChange={setOrientation}
        inventory={game.players[game.current].inventory}
        canRemove={canRemove}
        player={game.current}
        disabled={locked}
      />
      <Board
        game={view}
        moves={moves}
        onMove={(to) => play({ type: 'move', to })}
        wallTool={placing ? { kind: tool, orientation } : null}
        onPlaceWall={play}
        onPreviewChange={setPreviewError}
        removing={removing}
        onRemoveWall={(wallId) => play({ type: 'remove', wallId })}
      />
      <p className={`hint${hint?.error ? ' error' : ''}`} aria-live="polite">
        {hint ? hint.text : ' '}
      </p>
    </main>
  )
}

export default App
