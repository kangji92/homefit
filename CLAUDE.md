# CLAUDE.md

Homefit 저장소에서 AI 에이전트(Claude Code 등)와 개발자가 함께 따르는 운영 지침이다.
`ai-fe-harness`의 표준 접근(Markdown을 단일 진실 소스로)을 계승하되, Homefit은 **독립 실행·빌드·배포 가능한 프로젝트**다.

---

## Development Workflow

새 기능을 구현하기 전에 반드시 관련 설계 문서를 확인한다.

관련 설계 문서가 없다면:

1. 기능 요구사항을 분석한다.
2. `docs/` 아래 설계 문서를 먼저 작성한다.
3. 구현하지 않는다.
4. 사용자 검토 후 구현한다.

구현 시 설계 문서를 **source of truth**로 사용한다.

구현 과정에서 설계 변경이 필요한 경우, 코드만 임의로 변경하지 말고 **설계 문서를 먼저 수정**한다.

---

## 기술 스택

| 영역 | 선택 |
|------|------|
| Framework | Next.js 15/16 계열 + App Router |
| Language | TypeScript (`strict`) |
| Styling | Tailwind CSS |
| UI | shadcn/ui |
| Icons | lucide-react |
| Form | react-hook-form + zod |
| State | Zustand |
| Server/Data | Supabase |
| Query | TanStack Query |
| Testing | Vitest + React Testing Library + Playwright |

> 상세 버전·설정은 [`docs/development-environment.md`](docs/development-environment.md) 참조.

---

## 프로젝트 원칙

- **모바일 우선(Mobile First)**, 데스크톱은 자연스러운 반응형.
- **MVP는 mock 데이터**로 동작한다. 실제 API·지도·실거래가·로그인·결제·AI·대출·청약은 **구현하지 않는다**.
  - 단, 데이터 접근은 `data/repositories/` 인터페이스로 추상화해 **나중에 Supabase 구현으로 교체 가능**하게 만든다.
- **적합도 점수는 결정적(deterministic) 계산**으로 산출한다. AI가 점수를 임의로 생성하지 않는다.
- **과도한 추상화 금지.** 처음부터 불필요한 공통 컴포넌트를 만들지 않는다(YAGNI).
- `../ai-fe-harness`를 **런타임 import 하지 않는다.** 표준·설정만 복사해서 쓴다.
- 도메인 로직은 프레임워크/UI와 분리해 `domain/`에 순수 함수로 둔다.

---

## 컴포넌트·테스트·커밋 규칙

`docs/standards/`를 단일 진실 소스로 삼는다(‌`ai-fe-harness` 표준 이식). 코드를 생성하기 전에 관련 standard를 읽는다.

- **컴포넌트**: 폴더당 컴포넌트(`<Name>/{<Name>.tsx, <Name>.test.tsx, index.ts}`, `.stories.tsx`는 Storybook 도입 시 선택), 명시적 props 인터페이스, `any` 금지.
- **접근성**: 시맨틱 태그·role·label 우선, 키보드 접근성 고려.
- **테스트**: 모든 컴포넌트에 최소 1개 렌더 테스트. 사용자 관점 쿼리(`getByRole`/`getByLabelText`), 구현 세부 비의존.
- **커밋**: Conventional Commits (`feat`/`fix`/`refactor`/`test`/`docs`/`chore`), 본문에 "왜".

---

## 완료 기준

작업을 마치면 다음을 **통과**시킨다.

```bash
pnpm lint
pnpm typecheck
pnpm test
```
