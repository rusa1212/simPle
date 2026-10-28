import { useState } from 'react'
import { applyAction, createGame, getPawnMoves } from '@game'
import Board from './components/Board'
import './App.css'

const PLAYER_NAMES = ['A', 'B']

function App() {
  const [game, setGame] = useState(() => createGame())

  const moves = game.winner === null ? getPawnMoves(game, game.current) : []
  const handleMove = (to) => setGame((g) => applyAction(g, { type: 'move', to }))

  return (
    <main className="app">
      <h1>simPle</h1>
      <p className={`status status-p${game.winner ?? game.current}`}>
        {game.winner === null
          ? `${PLAYER_NAMES[game.current]} 차례`
          : `${PLAYER_NAMES[game.winner]} 승리!`}
      </p>
      <Board game={game} moves={moves} onMove={handleMove} />
    </main>
  )
}

export default App
