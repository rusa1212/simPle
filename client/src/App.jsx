import { useEffect, useState } from 'react'
import { applyAction, createGame, getPawnMoves } from '@game'
import Board from './components/Board'
import PlayerPanel from './components/PlayerPanel'
import Toolbar from './components/Toolbar'
import './App.css'

const PLAYER_NAMES = ['A', 'B']
const WALL_KINDS = ['normal', 'long', 'temp']

function App() {
  // 지금까지의 모든 상태. 마지막이 현재 상태이고, 무르기는 마지막을 빼는 것이다.
  const [history, setHistory] = useState(() => [createGame()])
  const [tool, setTool] = useState('move')
  const [orientation, setOrientation] = useState('h')
  const [previewError, setPreviewError] = useState(null)
  const [showPaths, setShowPaths] = useState(false)

  const game = history.at(-1)
  const canUndo = history.length > 1
  const over = game.winner !== null
  const placing = WALL_KINDS.includes(tool) && !over
  const removing = tool === 'remover' && !over
  const moves = !over && tool === 'move' ? getPawnMoves(game, game.current) : []
  const canRemove = game.walls.some((w) => w.owner !== game.current)

  let hint = null
  if (placing && previewError) hint = { text: previewError, error: true }
  else if (removing) hint = { text: '철거할 상대 막대를 클릭하세요 (Esc: 취소)', error: false }

  const play = (action) => {
    setHistory((h) => [...h, applyAction(h.at(-1), action)])
    setTool('move')
  }
  const undo = () => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
    setTool('move')
  }
  // 새 게임도 기록에 쌓아서, 실수로 눌렀을 때 무르기로 되돌릴 수 있게 한다
  const newGame = () => {
    setHistory((h) => [...h, createGame()])
    setTool('move')
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        undo()
        return
      }
      if (e.key === 'r' || e.key === 'R') setOrientation((o) => (o === 'h' ? 'v' : 'h'))
      if (e.key === 'Escape') setTool('move')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <main className="app">
      <header className="app-header">
        <h1>simPle</h1>
        <div className="game-actions">
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
          <button type="button" onClick={newGame}>
            새 게임
          </button>
        </div>
      </header>
      <p className={`status status-p${game.winner ?? game.current}`}>
        {over ? `${PLAYER_NAMES[game.winner]} 승리!` : `${PLAYER_NAMES[game.current]} 차례`}
      </p>
      <PlayerPanel game={game} showPaths={showPaths} />
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        orientation={orientation}
        onOrientationChange={setOrientation}
        inventory={game.players[game.current].inventory}
        canRemove={canRemove}
        player={game.current}
        disabled={over}
      />
      <Board
        game={game}
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
