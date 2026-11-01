# client

simPle의 화면 (React + Vite). 실행 방법과 전체 구조는 [루트 README](../README.md)를 본다.

- `npm run dev`: 개발 서버 (http://localhost:5173, `/api`는 4000번 서버로 프록시)
- `npm run build`: `dist/`에 정적 파일 생성
- `npm run lint`: oxlint 검사

게임 로직은 `@<게임 id>` 별칭으로 불러온다. 예: `@pathblock` → `shared/pathblock/index.ts` (`vite.config.js`, `jsconfig.json`).
