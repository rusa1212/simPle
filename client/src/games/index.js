import { lazy } from 'react'

/**
 * 메인 페이지에 펼쳐 보일 게임 목록. 새 게임은 여기에 한 항목만 추가하면 된다.
 * 게임 화면은 lazy로 불러와서, 들어갈 때 그 게임의 코드만 내려받는다.
 */
export const GAMES = [
  {
    id: 'pathblock',
    title: '막대 길막',
    summary: '말을 움직이거나 막대를 세워 상대의 길을 막고, 먼저 반대편 끝에 닿으면 이깁니다.',
    tags: ['2·4인', 'AI 대전', '보드게임'],
    Component: lazy(() => import('./pathblock/PathBlockGame.jsx')),
  },
]

export function findGame(id) {
  return GAMES.find((game) => game.id === id) ?? null
}
