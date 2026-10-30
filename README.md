# simPle

막대로 상대의 길을 막는 2인 보드게임이다.
두 플레이어가 9×9 보드 양 끝에서 출발해 상대편 끝 줄에 먼저 도착하면 이긴다.
자기 차례에는 말을 움직이거나, 막대를 설치하거나, 철거 도구로 상대 막대를 치울 수 있다.

## 게임 규칙

- 한 턴에 하나만 한다: 말 이동(상하좌우 1칸) / 막대 설치 / 철거 도구 사용
- 바로 옆에 상대 말이 있으면 뛰어넘고, 그 뒤가 막혀 있으면 대각선으로 비켜 간다.
- 막대는 겹치거나 십자로 교차할 수 없고, 어느 쪽이든 목표 줄로 가는 길을 완전히 막을 수 없다.

| 종류 | 길이 | 개수 | 특징 |
|---|---|---|---|
| 일반 막대 | 2칸 | 6 | 영구 |
| 긴 막대 | 3칸 | 2 | 영구 |
| 임시 막대 | 2칸 | 2 | 6수(양쪽 합산)가 지나면 사라짐 |
| 철거 도구 | - | 1 | 상대가 설치한 막대 1개 제거 |

자세한 규칙은 [docs/rules.md](docs/rules.md), 기획과 개발 순서는 [docs/game-design.md](docs/game-design.md)에 있다.

## 기능

- 같은 화면에서 번갈아 두는 2인 대전
- AI 상대 (보통: 탐색 깊이 2, 어려움: 깊이 3). AI는 B를 맡고 Web Worker에서 계산한다.
- 이동 가능한 칸 하이라이트, 막대 설치 미리보기 (설치할 수 없는 자리는 빨간색)
- 남은 막대 개수, 임시 막대 남은 턴, 양쪽 최단 경로 길이 표시
- 무르기, 새 게임

### 조작

| 키 | 동작 |
|---|---|
| `R` | 막대 방향 바꾸기 (가로/세로) |
| `Esc` | 말 이동 모드로 돌아가기 |
| `Ctrl+Z` | 무르기 |

## 실행 방법

### 준비

- Node.js 24 이상. `shared/`의 TypeScript를 빌드 없이 Node에서 바로 실행하기 때문이다.

```bash
npm run install:all
```

루트, `client/`, `server/`의 의존성을 한 번에 설치한다.

### 개발 서버

```bash
npm run dev
```

게임 서버(http://localhost:4000)와 클라이언트(http://localhost:5173)를 함께 띄운다.
브라우저에서 http://localhost:5173 을 열면 된다. 서버 포트는 `server/.env`의 `PORT`로 바꿀 수 있다 (`server/.env.example` 참고).

### 테스트와 검사

```bash
npm test           # 게임 로직과 AI 단위 테스트 (node:test)
npm run typecheck  # shared/ 타입 검사
npm run lint --prefix client
```

### 빌드

```bash
npm run build      # client/dist 에 정적 파일 생성
```

아직 서버가 빌드 결과를 제공하지 않으므로, 배포 전에는 `npm run preview --prefix client`로 빌드 결과를 확인한다.

## 폴더 구조

```
shared/game/   게임 로직과 AI (순수 TypeScript, UI·서버·AI가 함께 쓴다)
  game.ts        상태 생성, 수 검증과 적용
  moves.ts       말 이동과 점프
  walls.ts       막대 겹침·교차 판정
  path.ts        BFS 최단 경로
  ai.ts          평가 함수, 미니맥스 + 알파베타, 막대 후보 좁히기
client/        React + Vite + SVG 화면
server/        Express 서버 (온라인 대전 예정)
docs/          기획서와 규칙
```

## 진행 상황

- [x] 세그먼트 1: 게임 로직 모듈 + 테스트
- [x] 세그먼트 2: 로컬 2인 UI
- [x] 세그먼트 3: AI 상대
- [ ] 세그먼트 4: 온라인 대전 (Socket.IO, 방 코드)
- [ ] 세그먼트 5: 확장 규칙 (보드 크기, 안개 모드, 4인 모드, 기보 저장)
