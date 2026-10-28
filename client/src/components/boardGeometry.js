// 게임 좌표(x, y; y = 0이 아래쪽)를 SVG 좌표로 바꾸는 계산을 한곳에 모은다.

export const CELL = 52
export const GAP = 12
export const LABEL = 22
const STEP = CELL + GAP

export function boardPixels(size) {
  return size * CELL + (size - 1) * GAP
}

/** 칸 왼쪽 위 꼭짓점의 SVG 좌표 */
export function cellOrigin(size, x, y) {
  return { left: x * STEP, top: (size - 1 - y) * STEP }
}

export function cellCenter(size, x, y) {
  const { left, top } = cellOrigin(size, x, y)
  return { cx: left + CELL / 2, cy: top + CELL / 2 }
}

/** 막대가 놓이는 홈의 사각형 */
export function wallRect(size, { orientation, x, y, length }) {
  const span = length * CELL + (length - 1) * GAP
  if (orientation === 'h') {
    // (x, y) 칸 바로 위의 가로 홈
    const { left, top } = cellOrigin(size, x, y)
    return { x: left, y: top - GAP, width: span, height: GAP }
  }
  // (x, y)부터 위로 이어지는 칸들의 오른쪽 세로 홈. 화면상 맨 위 칸이 기준
  const { left, top } = cellOrigin(size, x, y + length - 1)
  return { x: left + CELL, y: top, width: GAP, height: span }
}

export const columnLabel = (x) => String.fromCharCode(97 + x)
export const rowLabel = (y) => String(y + 1)
