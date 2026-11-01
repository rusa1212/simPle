# simPle

웹에서 바로 할 수 있는 작은 게임 모음이다.
메인 페이지에서 게임을 고르면 해당 게임 화면으로 이동한다.

## 게임 목록

| 게임 | 한 줄 소개 | 문서 |
|---|---|---|
| 막대 길막 | 막대로 상대의 길을 막으며 먼저 반대편 끝에 닿는 보드게임 (2·4인, AI 대전) | [docs/games/pathblock](docs/games/pathblock/README.md) |

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
브라우저에서 http://localhost:5173 을 열면 게임 목록이 나온다. 서버 포트는 `server/.env`의 `PORT`로 바꿀 수 있다 (`server/.env.example` 참고).

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
client/src/
  App.jsx          주소에 따라 메인 페이지 또는 게임 화면을 띄운다
  useHashRoute.js  # 뒤 주소(#/games/<id>)를 읽는 라우터
  pages/Home.jsx   메인 페이지 (게임 목록)
  games/index.js   게임 목록(GAMES) 등록
  games/<id>/      게임별 화면 코드
shared/            게임 로직 (순수 TypeScript, 화면·서버·AI가 함께 쓴다)
server/            Express 서버 (온라인 대전 예정)
docs/games/<id>/   게임별 문서 (소개, 규칙, 기획서)
```

## 새 게임 추가하기

1. `client/src/games/<id>/`에 게임 화면 컴포넌트를 만든다. 게임 로직이 있으면 `shared/`에 둔다.
2. `client/src/games/index.js`의 `GAMES`에 항목을 추가한다 (`id`, `title`, `summary`, `tags`, `Component`).
   메인 페이지에 카드가 생기고 `#/games/<id>`로 들어갈 수 있다.
3. 게임 화면에는 메인으로 돌아가는 `<a href="#/">` 링크를 둔다.
4. `docs/games/<id>/`에 README와 규칙 문서를 쓰고, 위 게임 목록 표에 한 줄을 추가한다.
