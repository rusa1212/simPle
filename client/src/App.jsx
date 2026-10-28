import { useEffect, useState } from 'react'
import { createGame, getPathLengths } from '@game'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [game] = useState(() => createGame())

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  const [pathA, pathB] = getPathLengths(game)

  return (
    <main>
      <h1>simPle</h1>
      <p>
        Server:{' '}
        {error ? `error (${error})` : health ? health.status : 'checking...'}
      </p>
      <p>
        {game.config.size}×{game.config.size} 보드 · 최단 경로 A {pathA} / B {pathB}
      </p>
    </main>
  )
}

export default App
