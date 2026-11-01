import { useSyncExternalStore } from 'react'

// 주소의 # 뒤를 경로로 쓴다. 서버에 경로별 설정이 없어도 새로고침과 뒤로 가기가 그대로 동작한다.
// '#/games/pathblock' → '/games/pathblock', 없으면 '/'
function getPath() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function subscribe(onChange) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useHashRoute() {
  return useSyncExternalStore(subscribe, getPath)
}

export function gamePath(id) {
  return `#/games/${id}`
}
