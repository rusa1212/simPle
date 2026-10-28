import { useEffect, useState } from 'react'
import { applyAction, createGame, getPawnMoves } from '@game'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import './App.css'

const PLAYER_NAMES = ['A', 'B']
const WALL_KINDS = ['normal', 'long', 'temp']

function App() {
  const [game, setGame] = useState(() => createGame())
  const [tool, setTool] = useState('move')
  const [orientation, setOrientation] = useState('h')
  const [previewError, setPreviewError] = useState(null)

  const over = game.winner !== null
  const placing = WALL_KINDS.includes(tool) && !over
  const removing = tool === 'remover' && !over
  const moves = !over && tool === 'move' ? getPawnMoves(game, game.current) : []
  const canRemove = game.walls.some((w) => w.owner !== game.current)

  let hint = null
  if (placing && previewError) hint = { text: previewError, error: true }
  else if (removing) hint = { text: '철거할 상대 막대를 클릭하세요 (Esc: 취소)', error: false }

  const play = (action) => {
    setGame((g) => applyAction(g, action))
    setTool('move')
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if (e.key === 'r' || e.key === 'R') setOrientation((o) => (o === 'h' ? 'v' : 'h'))
      if (e.key === 'Escape') setTool('move')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <main className="app">
      <h1>simPle</h1>
      <p className={`status status-p${game.winner ?? game.current}`}>
        {over ? `${PLAYER_NAMES[game.winner]} 승리!` : `${PLAYER_NAMES[game.current]} 차례`}
      </p>
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
