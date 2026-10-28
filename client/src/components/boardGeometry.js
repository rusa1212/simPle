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

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * SVG 좌표의 마우스 위치에서 가장 가까운 홈에 놓일 막대 위치를 구한다.
 * 막대 가운데가 마우스 쪽으로 오도록 잡는다. 보드 밖이면 null.
 */
export function wallAtPoint(size, px, py, orientation, length) {
  const pixels = boardPixels(size)
  if (px < 0 || py < 0 || px > pixels || py > pixels) return null
  // 칸 i가 [i, i+1) 구간이 되도록 홈 폭의 절반만큼 밀어서 칸 단위로 바꾼다
  const u = (px + GAP / 2) / STEP
  const v = (py + GAP / 2) / STEP
  if (orientation === 'h') {
    const boundary = clamp(Math.round(v), 1, size - 1) // 화면 위에서부터 몇 번째 가로 홈인지
    return {
      orientation,
      x: clamp(Math.round(u - length / 2), 0, size - length),
      y: size - 1 - boundary,
      length,
    }
  }
  const boundary = clamp(Math.round(u), 1, size - 1)
  const topRow = clamp(Math.round(v - length / 2), 0, size - length)
  return { orientation, x: boundary - 1, y: size - topRow - length, length }
}

export const columnLabel = (x) => String.fromCharCode(97 + x)
export const rowLabel = (y) => String(y + 1)
