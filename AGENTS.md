<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## Homefit 프로젝트 규칙

> 위 블록은 `next dev`가 자동 관리한다. 그 아래 내용만 사람이 유지한다.

이 저장소의 개발 규칙·워크플로우는 **[CLAUDE.md](./CLAUDE.md)**, 개발 표준은 **[docs/standards/](./docs/standards/)**, 기능 설계는 **[docs/design/](./docs/design/)**를 단일 진실 소스로 삼는다.

- 기능 구현 전 관련 **설계 문서를 먼저 확인/작성**하고 사용자 검토 후 구현한다(CLAUDE.md Development Workflow).
- 적합도 점수는 **결정적 계산**(`docs/design/scoring.md`)이며 AI가 생성하지 않는다.
 