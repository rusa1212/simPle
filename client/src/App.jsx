import { useEffect, useState } from 'react'
import { applyAction, createGame, getPawnMoves } from '@game'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import './App.css'

const PLAYER_NAMES = ['A', 'B']

function App() {
  const [game, setGame] = useState(() => createGame())
  const [tool, setTool] = useState('move')
  const [orientation, setOrientation] = useState('h')
  const [previewError, setPreviewError] = useState(null)

  const over = game.winner !== null
  const placing = tool !== 'move' && !over
  const moves = !over && !placing ? getPawnMoves(game, game.current) : []

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
      />
      <p className="hint" aria-live="polite">
        {placing && previewError ? previewError : ' '}
      </p>
    </main>
  )
}

export default App
