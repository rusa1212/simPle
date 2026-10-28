import { useState } from 'react'
import { createGame } from '@game'
import Board from './components/Board'
import './App.css'

function App() {
  const [game] = useState(() => createGame())

  return (
    <main className="app">
      <h1>simPle</h1>
      <Board game={game} />
    </main>
  )
}

export default App
