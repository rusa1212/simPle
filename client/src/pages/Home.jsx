import { GAMES } from '../games'
import { gamePath } from '../useHashRoute'
import './Home.css'

function Home() {
  return (
    <main className="home">
      <header className="home-header">
        <h1>simPle</h1>
        <p>하고 싶은 게임을 고르세요.</p>
      </header>
      <ul className="game-list">
        {GAMES.map((game) => (
          <li key={game.id}>
            <a className="game-card" href={gamePath(game.id)}>
              <h2>{game.title}</h2>
              <p>{game.summary}</p>
              <ul className="game-tags">
                {game.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <span className="game-play">플레이 →</span>
            </a>
          </li>
        ))}
        <li className="game-card upcoming" aria-hidden="true">
          <h2>다음 게임</h2>
          <p>준비 중입니다.</p>
        </li>
      </ul>
    </main>
  )
}

export default Home
