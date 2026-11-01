import { Suspense, useEffect } from 'react'
import { findGame } from './games'
import Home from './pages/Home'
import { useHashRoute } from './useHashRoute'

function App() {
  const path = useHashRoute()
  const match = path.match(/^\/games\/([^/]+)/)
  const game = match ? findGame(match[1]) : null

  useEffect(() => {
    document.title = game ? `${game.title} · simPle` : 'simPle'
  }, [game])

  if (!game) return <Home />

  const { Component } = game
  return (
    // 게임마다 key를 달아서 다른 게임으로 옮겨 가면 상태를 새로 시작한다
    <Suspense fallback={<p className="loading">불러오는 중…</p>}>
      <Component key={game.id} />
    </Suspense>
  )
}

export default App
