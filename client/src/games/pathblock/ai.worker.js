import { chooseAction } from '@game'

// 탐색이 수 초 걸릴 수 있어서 화면이 멈추지 않도록 별도 스레드에서 계산한다
self.onmessage = (e) => {
  const { state, depth } = e.data
  self.postMessage(chooseAction(state, depth))
}
