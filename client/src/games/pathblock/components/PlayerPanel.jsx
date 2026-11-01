import { getPathLengths } from '@game'

const PLAYER_NAMES = ['A', 'B', 'C', 'D']
const ITEMS = [
  { key: 'normal', name: '일반' },
  { key: 'long', name: '긴' },
  { key: 'temp', name: '임시' },
  { key: 'remover', name: '철거' },
]

/** isAi: 플레이어 번호를 받아 AI가 맡았는지 돌려준다 */
function PlayerPanel({ game, showPaths, isAi }) {
  const paths = showPaths ? getPathLengths(game) : null

  return (
    <div className={`players players-${game.players.length}`}>
      {game.players.map((player, i) => {
        const active = game.winner === null && game.current === i
        const won = game.winner === i
        return (
          <section
            key={i}
            className={`player player-p${i}${active ? ' active' : ''}${won ? ' won' : ''}`}
            aria-label={`플레이어 ${PLAYER_NAMES[i]}`}
          >
            <header>
              <span className="player-badge">{PLAYER_NAMES[i]}</span>
              {isAi(i) && <span className="player-ai">AI</span>}
              {active && <span className="player-tag">차례</span>}
              {won && <span className="player-tag">승리</span>}
              {paths && <span className="player-path">목표까지 {paths[i]}칸</span>}
            </header>
            <ul className="inventory">
              {ITEMS.map(({ key, name }) => (
                <li key={key} className={player.inventory[key] === 0 ? 'empty' : undefined}>
                  {name} <strong>{player.inventory[key]}</strong>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export default PlayerPanel
